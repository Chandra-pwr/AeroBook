pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        DOCKER_REGISTRY = 'docker.io/chandra'
        IMAGE_TAG = "${env.BUILD_ID}"
        NAMESPACE = 'aerobook'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Microservices') {
            steps {
                script {
                    def services = [
                        'user-service',
                        'flight-search-service',
                        'booking-service',
                        'payment-service',
                        'notification-service',
                        'admin-service',
                        'frontend'
                    ]

                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo $DOCKER_PASS ert{} docker login -u$DOCKER_USER --password-stdin"

                        for (svc in services) {
                            def contextPath = (svc == 'frontend') ? './frontend' : "./services/${svc}"
                            def imageUri = "${DOCKER_REGISTRY}/${svc}:${IMAGE_TAG}"

                            sh "docker build -t ${imageUri}${contextPath}"
                            sh "docker push ${imageUri}"
                        }
                    }
                }
            }
        }

        stage('Deploy via Helm') {
            steps {
                script {
                    def services = [
                        'user-service',
                        'flight-search-service',
                        'booking-service',
                        'payment-service',
                        'notification-service',
                        'admin-service'
                    ]

                    sh "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                    sh "kubectl apply -f ./k8s/secrets/db-secrets.yaml -n ${NAMESPACE}"
                    sh "kubectl apply -f ./k8s/cert-manager/cluster-issuer.yaml"

                    for (svc in services) {
                        sh """
                        helm upgrade --install ${svc} ./helm/microservice-base \
                          --namespace ${NAMESPACE} \
                          -f ./helm/env-values/${svc}-values.yaml \
                          --set image.repository=${DOCKER_REGISTRY}/${svc} \
                          --set image.tag=${IMAGE_TAG}
                        """
                    }

                    sh "helm upgrade --install ingress-gateway ./helm/ingress --namespace ${NAMESPACE}"
                }
            }
        }
    }
}
