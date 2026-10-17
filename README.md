# AeroBook - Flight Reservation System (3-Tier Microservices)
Maintained for DevOps practice by Chandra Prakash Digarse.

## Architecture
- **Frontend**: React + Tailwind + Nginx (Static build, reverse proxy)
- **6 Microservices**:
  1. `user-service` (Port 3001)
  2. `flight-search-service` (Port 3002)
  3. `booking-service` (Port 3003)
  4. `payment-service` (Port 3004)
  5. `notification-service` (Port 3005)
  6. `admin-service` (Port 3006)
- **Ingress & Domain**: Nginx Ingress routing under `devchandra.shop` & Let's Encrypt TLS
- **Database**: Single PostgreSQL RDS instance with schema isolation
# AeroBook
