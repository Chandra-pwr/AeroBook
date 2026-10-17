-- Database Schema Isolation Setup for AeroBook
CREATE USER user_svc WITH PASSWORD 'user_pass';
CREATE SCHEMA user_data AUTHORIZATION user_svc;

CREATE USER search_svc WITH PASSWORD 'search_pass';
CREATE SCHEMA search_data AUTHORIZATION search_svc;

CREATE USER booking_svc WITH PASSWORD 'booking_pass';
CREATE SCHEMA booking_data AUTHORIZATION booking_svc;

CREATE USER payment_svc WITH PASSWORD 'payment_pass';
CREATE SCHEMA payment_data AUTHORIZATION payment_svc;

CREATE USER admin_svc WITH PASSWORD 'admin_pass';
CREATE SCHEMA admin_data AUTHORIZATION admin_svc;
