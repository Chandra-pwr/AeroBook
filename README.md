# AeroBook — Flight Reservation System

AeroBook is a microservices-based flight reservation project built for learning application deployment, Docker, Kubernetes, Helm, PostgreSQL, CI/CD, and DevOps practices.

> **Learning project:** Configure your own container registry, database credentials, domain, and Kubernetes environment before deploying. The default configuration is not production-ready.

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Option A: Deploy with Kubernetes and Helm](#option-a-deploy-with-kubernetes-and-helm)
- [Configure PostgreSQL and Secrets](#configure-postgresql-and-secrets)
- [Build and Push Container Images](#build-and-push-container-images)
- [Deploy Microservices](#deploy-microservices)
- [Deploy the Frontend](#deploy-the-frontend)
- [Access and Verify the Application](#access-and-verify-the-application)
- [Option B: Run with Docker Compose](#option-b-run-with-docker-compose)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)
- [Security Notes](#security-notes)

## Architecture

The project contains a React frontend, six Node.js microservices, and PostgreSQL.

| Component | Container port | Purpose |
|---|---:|---|
| Frontend | 80 | Web interface |
| user-service | 3000 | User and authentication operations |
| flight-search-service | 3000 | Flight search |
| booking-service | 3000 | Booking operations |
| payment-service | 3000 | Payment API |
| notification-service | 3000 | Notifications |
| admin-service | 3000 | Administrative operations |
| PostgreSQL | 5432 | Persistent application data |

Kubernetes services expose the microservices internally. An Ingress controller can provide external HTTP/HTTPS access.

## Prerequisites

For Kubernetes deployment, install and configure:

- Git
- Docker
- `kubectl`
- Kubernetes cluster (for example, k3s or Amazon EKS)
- Helm 3
- A container registry accessible by your cluster
- A Kubernetes StorageClass that supports persistent volumes

For AWS EKS, configure AWS CLI credentials and ECR access separately.

Check the tools:

```bash
git --version
docker --version
kubectl version --client
helm version
kubectl get nodes
kubectl get storageclass
```

## Repository Structure

```text
AeroBook/
├── database/
│   └── init.sql
├── frontend/
│   ├── Dockerfile
│   └── src/
├── services/
│   ├── user-service/
│   ├── flight-search-service/
│   ├── booking-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── admin-service/
├── helm/
│   ├── microservice-base/
│   ├── ingress/
│   └── env-values/
├── k8s/
│   ├── frontend.yaml
│   ├── frontend-ingress.yaml
│   ├── postgres-deployment.yaml
│   └── postgres-storage.yaml
├── docker-compose.yml
└── README.md
```

## Option A: Deploy with Kubernetes and Helm

### 1. Clone the repository

```bash
git clone https://github.com/Chandra-pwr/AeroBook.git
cd AeroBook
```

Select the branch you intend to deploy:

```bash
git checkout fix/payment-auth
```

If using a different branch, check that its README and Kubernetes configuration match the commands below.

### 2. Create the namespace

```bash
kubectl create namespace aerobook \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl config set-context --current --namespace=aerobook
```

### 3. Check the cluster and storage

```bash
kubectl get nodes
kubectl get storageclass
```

The provided PostgreSQL PVC uses the AWS `gp2` StorageClass. If your cluster uses another StorageClass, edit `k8s/postgres-storage.yaml` before applying it.

### 4. Configure PostgreSQL and Secrets

**Never commit actual credentials to Git.** Create the database URLs and passwords for your own environment.

First inspect the database initialization script and the service configuration:

```bash
cat database/init.sql
cat helm/env-values/user-service-values.yaml
cat helm/env-values/booking-service-values.yaml
cat helm/env-values/payment-service-values.yaml
```

The Helm values expect these keys in a Secret named `db-secrets`:

- `user_db_url`
- `search_db_url`
- `booking_db_url`
- `payment_db_url`
- `admin_db_url`

Create that Secret in the `aerobook` namespace. Replace every placeholder with a valid connection URL matching the database roles, passwords, and database name configured by your SQL initialization script.

```bash
kubectl create secret generic db-secrets \
  --namespace aerobook \
  --from-literal=user_db_url='postgres://USER:PASSWORD@postgres-service:5432/aerobook' \
  --from-literal=search_db_url='postgres://USER:PASSWORD@postgres-service:5432/aerobook' \
  --from-literal=booking_db_url='postgres://USER:PASSWORD@postgres-service:5432/aerobook' \
  --from-literal=payment_db_url='postgres://USER:PASSWORD@postgres-service:5432/aerobook' \
  --from-literal=admin_db_url='postgres://USER:PASSWORD@postgres-service:5432/aerobook'
```

The command above is a template: replace the credentials separately for each service. Do not use the literal `USER:PASSWORD` placeholders.

Create PostgreSQL credentials for the database Deployment:

```bash
kubectl create secret generic postgres-credentials \
  --namespace aerobook \
  --from-literal=POSTGRES_USER='YOUR_POSTGRES_USER' \
  --from-literal=POSTGRES_PASSWORD='YOUR_STRONG_PASSWORD'
```

The SQL initialization script must create the application roles and permissions expected by your service connection URLs. PostgreSQL initialization scripts in `/docker-entrypoint-initdb.d` normally run only when the data directory is first initialized.

Create a shared JWT signing secret for the services that validate JWTs:

```bash
openssl rand -hex 32
```

Use the generated value to create the Secret. Paste it into the command locally; do not publish it:

```bash
kubectl create secret generic aerobook-auth-secret \
  --namespace aerobook \
  --from-literal=JWT_SECRET='REPLACE_WITH_GENERATED_RANDOM_VALUE'
```

The user, booking, and payment services must use compatible JWT configuration. Verify token issuer and audience settings in the source code before testing authenticated endpoints.

### 5. Deploy PostgreSQL

Create a ConfigMap from the initialization script, then deploy storage and PostgreSQL:

```bash
kubectl create configmap postgres-init \
  --namespace aerobook \
  --from-file=init.sql=database/init.sql \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/postgres-storage.yaml
kubectl apply -f k8s/postgres-deployment.yaml
```

Wait for PostgreSQL:

```bash
kubectl rollout status deployment/postgres \
  --namespace aerobook --timeout=180s

kubectl get pods,svc,pvc --namespace aerobook
```

Do not deploy the application services until PostgreSQL is ready.

### 6. Build and push container images

Build one image for each service and the frontend. Choose a registry that your Kubernetes nodes can pull from.

The following example assumes you have authenticated to your registry and have permission to push images.

Set your registry image name. For AWS ECR, create the repository and authenticate to the correct AWS account and region first.

```bash
export IMAGE_REPO='YOUR_REGISTRY_NAMESPACE/aerobook'
export TAG='v1'
```

For example, `IMAGE_REPO` could be an ECR repository URI or a repository in Docker Hub. Replace the placeholder with your actual repository.

Build and push the backend images:

```bash
for service in \
  user-service \
  flight-search-service \
  booking-service \
  payment-service \
  notification-service \
  admin-service
do
  docker build \
    -t "${IMAGE_REPO}:${service}-${TAG}" \
    "services/${service}"

  docker push "${IMAGE_REPO}:${service}-${TAG}"
done
```

Build and push the frontend:

```bash
docker build -t "${IMAGE_REPO}:frontend-${TAG}" ./frontend
docker push "${IMAGE_REPO}:frontend-${TAG}"
```

If the registry is private, configure `imagePullSecrets` in the Kubernetes namespace or use the registry integration supported by your cluster.

### 7. Deploy the six microservices

The repository provides a reusable Helm chart at `helm/microservice-base`. Each service needs its own image tag and values file.

Run these commands from the repository root after building and pushing all images:

```bash
helm upgrade --install user-service \
  ./helm/microservice-base \
  --namespace aerobook \
  -f helm/env-values/user-service-values.yaml \
  --set image.repository="${IMAGE_REPO}" \
  --set image.tag="user-service-${TAG}"

helm upgrade --install flight-search-service \
  ./helm/microservice-base \
  --namespace aerobook \
  -f helm/env-values/flight-search-service-values.yaml \
  --set image.repository="${IMAGE_REPO}" \
  --set image.tag="flight-search-service-${TAG}"

helm upgrade --install booking-service \
  ./helm/microservice-base \
  --namespace aerobook \
  -f helm/env-values/booking-service-values.yaml \
  --set image.repository="${IMAGE_REPO}" \
  --set image.tag="booking-service-${TAG}"

helm upgrade --install payment-service \
  ./helm/microservice-base \
  --namespace aerobook \
  -f helm/env-values/payment-service-values.yaml \
  --set image.repository="${IMAGE_REPO}" \
  --set image.tag="payment-service-${TAG}"

helm upgrade --install notification-service \
  ./helm/microservice-base \
  --namespace aerobook \
  -f helm/env-values/notification-service-values.yaml \
  --set image.repository="${IMAGE_REPO}" \
  --set image.tag="notification-service-${TAG}"

helm upgrade --install admin-service \
  ./helm/microservice-base \
  --namespace aerobook \
  -f helm/env-values/admin-service-values.yaml \
  --set image.repository="${IMAGE_REPO}" \
  --set image.tag="admin-service-${TAG}"
```

Check rollout status:

```bash
kubectl get deployments,pods,services --namespace aerobook
kubectl rollout status deployment/user-service --namespace aerobook
kubectl rollout status deployment/flight-search-service --namespace aerobook
kubectl rollout status deployment/booking-service --namespace aerobook
kubectl rollout status deployment/payment-service --namespace aerobook
kubectl rollout status deployment/notification-service --namespace aerobook
kubectl rollout status deployment/admin-service --namespace aerobook
```

If a rollout fails, inspect the logs and events before proceeding.

### 8. Deploy the frontend

The supplied `k8s/frontend.yaml` uses an example ECR image URI. Update that image to the one you pushed:

```bash
kubectl set image deployment/aerobook-frontend \
  frontend="${IMAGE_REPO}:frontend-${TAG}" \
  --namespace aerobook
```

If the frontend Deployment does not exist yet, edit `k8s/frontend.yaml` to use your image and set `metadata.namespace: aerobook` for both the Deployment and Service. Then apply it:

```bash
kubectl apply -f k8s/frontend.yaml
kubectl rollout status deployment/aerobook-frontend \
  --namespace aerobook --timeout=180s
```

The frontend's API URLs and reverse-proxy configuration must point to the correct service or Ingress paths for your environment. Check `frontend/nginx.conf` and the frontend source before exposing the application.

### 9. Configure Ingress (optional)

Ingress requires a compatible Ingress controller installed in your cluster.

This repository includes configurations intended for different environments:
- `k8s/frontend-ingress.yaml` contains AWS ALB-specific annotations.
- `helm/ingress` contains NGINX Ingress and a sample domain/TLS configuration.

Choose the configuration matching your cluster. Before applying it:
1. Set the correct namespace.
2. Confirm the Ingress controller and `ingressClassName`.
3. Replace example hostnames with a domain you control.
4. Configure DNS, TLS, and certificate management if required.
5. Confirm the paths and backend service names match your frontend and API configuration.

Do not expect the example domain or TLS certificate to work automatically in a new environment.

## Access and Verify the Application

Check the deployment:

```bash
kubectl get pods -n aerobook
kubectl get svc -n aerobook
kubectl get ingress -n aerobook
kubectl get events -n aerobook --sort-by=.lastTimestamp
```

For a temporary local frontend connection, use port-forwarding:

```bash
kubectl port-forward \
  --namespace aerobook \
  service/aerobook-frontend 8080:80
```

Open `http://localhost:8080` on the machine running the port-forward command. If running it on a remote EC2 instance, use an SSH tunnel or a suitable secure access method.

To inspect a service:

```bash
kubectl logs deployment/user-service -n aerobook
kubectl logs deployment/payment-service -n aerobook
kubectl describe deployment/payment-service -n aerobook
```

The payment API requires authentication for protected operations. A request without a valid bearer token should be rejected. Use a valid token obtained through the application's authentication flow when testing protected endpoints.

## Option B: Run with Docker Compose

For local learning, Docker Compose may be simpler than Kubernetes.

```bash
git clone https://github.com/Chandra-pwr/AeroBook.git
cd AeroBook
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f
```

The current Compose file uses example database credentials and service connection URLs. Review `docker-compose.yml` and `database/init.sql` and ensure the PostgreSQL roles/passwords match before relying on the application.

Stop the containers:

```bash
docker compose down
```

To also delete the local database volume (this permanently removes its stored data):

```bash
docker compose down -v
```

## Troubleshooting

### Pods are stuck in `ImagePullBackOff`

- Check the image repository and tag.
- Confirm the image was pushed successfully.
- Ensure the cluster can access the registry.
- Configure `imagePullSecrets` if the registry is private.

```bash
kubectl describe pod POD_NAME -n aerobook
```

### Pods are stuck in `Pending`

Check persistent volumes, StorageClass configuration, available CPU/memory, and cluster events:

```bash
kubectl get pvc -n aerobook
kubectl describe pod POD_NAME -n aerobook
kubectl get events -n aerobook --sort-by=.lastTimestamp
```

### Database connection errors

- Verify PostgreSQL is ready.
- Confirm `postgres-service` exists in namespace `aerobook`.
- Verify the database URLs, role names, passwords, and permissions.
- Check the initialization script and PostgreSQL logs.

```bash
kubectl get pods,svc -n aerobook
kubectl logs deployment/postgres -n aerobook
```

### Secret-related errors

Secret names and keys must match the Helm values. Confirm that Secrets exist without printing their contents:

```bash
kubectl get secrets -n aerobook
```

### Service is not ready

```bash
kubectl describe deployment SERVICE_NAME -n aerobook
kubectl logs deployment/SERVICE_NAME -n aerobook
```

## Cleanup

Remove the Helm releases:

```bash
for service in \
  user-service flight-search-service booking-service \
  payment-service notification-service admin-service
do
  helm uninstall "$service" --namespace aerobook
done
```

Remove the frontend and PostgreSQL resources if you created them for this exercise:

```bash
kubectl delete -f k8s/frontend.yaml --ignore-not-found
kubectl delete -f k8s/postgres-deployment.yaml --ignore-not-found
kubectl delete -f k8s/postgres-storage.yaml --ignore-not-found
kubectl delete configmap postgres-init -n aerobook --ignore-not-found
```

Deleting the namespace removes its namespaced resources, including Secrets. Persistent volumes and underlying storage may have separate lifecycle rules. Verify backups and data-retention requirements before deleting storage.

## Security Notes

- Never commit `.env` files, passwords, private keys, or Kubernetes Secret manifests containing real credentials.
- Use a strong, randomly generated JWT secret and keep it consistent across services that validate the same tokens.
- Use TLS for public endpoints and restrict database access to the required services.
- Avoid exposing PostgreSQL directly to the public internet.
- Use least-privilege IAM and registry permissions.
- Rotate any credential that has accidentally been exposed.
- This repository is intended for education and practice. Review authentication, authorization, database migrations, resource limits, network policies, and monitoring before production use.

## Maintainer

Maintained for DevOps learning and practice by Chandra Prakash Digarse.
