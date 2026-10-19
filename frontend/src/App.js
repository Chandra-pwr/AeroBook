import React, { useState } from 'react';
import {
  Plane, ArrowLeftRight, Search, CalendarDays, Users,
  MapPin, Clock3, ArrowRight, Menu, ShieldCheck,
  Headphones, Globe2, Sparkles, ChevronDown
} from 'lucide-react';
import './App.css';

const popularDestinations = [
  {
    city: 'Goa',
    country: 'India',
    code: 'GOI',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=700&q=85',
    label: 'Beach escape'
  },
  {
    city: 'Dubai',
    country: 'United Arab Emirates',
    code: 'DXB',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=85',
    label: 'City adventure'
  },
  {
    city: 'Bali',
    country: 'Indonesia',
    code: 'DPS',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=85',
    label: 'Tropical getaway'
  }
];

export default function App() {
  const [origin, setOrigin] = useState('DEL');
  const [dest, setDest] = useState('BOM');
  const [departureDate, setDepartureDate] = useState('');
  const [passengers, setPassengers] = useState('1 passenger');
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
	const [selectedFlight, setSelectedFlight] = useState(null);
const [travellerName, setTravellerName] = useState('');
const [travellerEmail, setTravellerEmail] = useState('');
const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [loginOpen, setLoginOpen] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [registerName, setRegisterName] = useState('');


  async function searchFlights(event) {
    event.preventDefault();
    setError('');
    setFlights([]);
    setLoading(true);
    setSearched(false);

    try {
      const response = await fetch(
        `/api/flights/search?origin=${encodeURIComponent(origin.trim().toUpperCase())}&destination=${encodeURIComponent(dest.trim().toUpperCase())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Flight search failed. Please try again.');
      }

      setFlights(data.flights || []);
      setSearched(true);

      if (data.demo) {
        setError('Sample flight results — live airline availability is not connected.');
      }
    } catch (err) {
      setError(err.message || 'Unable to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function chooseDestination(code) {
    setDest(code);
    document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="travel-app">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="AeroBook home">
          <span className="brand-icon"><Plane size={22} /></span>
          <span>AERO<span className="brand-accent">BOOK</span></span>
        </a>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <Menu size={23} />
        </button>

        <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`}>
          <a className="nav-active" href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#destinations" onClick={() => setMenuOpen(false)}>Destinations</a>
          <a href="#flight-search" onClick={() => setMenuOpen(false)}>Flights</a>
          <a href="#why-aerobook" onClick={() => setMenuOpen(false)}>About us</a>
        </nav>

        <div className="header-actions">
          {currentUser ? (
            <>
              <span className="logged-in-name">
                Hi, {currentUser.name.split(' ')[0]}
              </span>
              <button
                type="button"
                className="login-link login-trigger"
                onClick={() => {
                  setCurrentUser(null);
                  setTravellerName('');
                  setTravellerEmail('');
                  setBookingMessage('');
                  setCreatedBookingId(null);
                  setPaymentMessage('');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className="login-link login-trigger"
              onClick={() => {
                setLoginMessage('');
                setLoginOpen(true);
              }}
            >
              Login
            </button>
          )}
          <a href="#flight-search" className="header-cta">
            Get started <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} />
              YOUR JOURNEY, REIMAGINED
            </div>

            <h1>
              Your next adventure
              <br />
              starts <span>here.</span>
            </h1>

            <p className="hero-description">
              Discover new places, find flights that fit your plans,
              and make every journey a little more extraordinary.
            </p>

            <div className="hero-actions">
              <a href="#flight-search" className="primary-button">
                Find your flight <ArrowRight size={18} />
              </a>
              <div className="hero-trust">
                <span className="trust-icon"><ShieldCheck size={18} /></span>
                <span><strong>Simple & secure</strong><small>Your journey starts with confidence</small></span>
              </div>
            </div>

            <div className="hero-stats">
              <div><strong>Explore</strong><span>New destinations</span></div>
              <div><strong>Compare</strong><span>Flight options</span></div>
              <div><strong>Discover</strong><span>Your next story</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-photo">
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=90"
                alt="Airplane wing above the clouds"
              />
              <div className="photo-gradient" />
              <div className="photo-caption">
                <span className="caption-icon"><Globe2 size={19} /></span>
                <span><small>THE WORLD IS WAITING</small><strong>Somewhere wonderful</strong></span>
              </div>
            </div>

            <div className="floating-card floating-card-top">
              <span className="floating-icon"><Plane size={19} /></span>
              <span><strong>Adventure awaits</strong><small>Where will you go next?</small></span>
            </div>

            <div className="floating-card floating-card-bottom">
              <span className="status-dot" />
              <span><strong>Ready for takeoff?</strong><small>Let's plan your next trip</small></span>
            </div>
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
          </div>
        </section>

        <section className="search-section" id="flight-search">
          <div className="search-heading">
            <div>
              <span className="section-kicker">PLAN YOUR TRIP</span>
              <h2>Where to next?</h2>
            </div>
            <span className="flight-tab"><Plane size={17} /> Flights</span>
          </div>

          <form className="flight-form" onSubmit={searchFlights}>
            <div className="field-group route-field">
              <label htmlFor="origin">FROM</label>
              <div className="field-control">
                <MapPin size={18} />
                <input
                  id="origin"
                  value={origin}
                  onChange={e => setOrigin(e.target.value.toUpperCase())}
                  placeholder="DEL"
                  maxLength={3}
                  aria-label="Origin airport code"
                  required
                />
              </div>
              <small>Airport code</small>
            </div>

            <button
              type="button"
              className="swap-button"
              aria-label="Swap origin and destination"
              onClick={() => {
                setOrigin(dest);
                setDest(origin);
              }}
            >
              <ArrowLeftRight size={18} />
            </button>

            <div className="field-group route-field">
              <label htmlFor="destination">TO</label>
              <div className="field-control">
                <MapPin size={18} />
                <input
                  id="destination"
                  value={dest}
                  onChange={e => setDest(e.target.value.toUpperCase())}
                  placeholder="BOM"
                  maxLength={3}
                  aria-label="Destination airport code"
                  required
                />
              </div>
              <small>Airport code</small>
            </div>

            <div className="field-group date-field">
              <label htmlFor="departure">DEPARTURE</label>
              <div className="field-control">
                <CalendarDays size={18} />
                <input
                  id="departure"
                  type="date"
                  value={departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDepartureDate(e.target.value)}
                  aria-label="Departure date"
                />
              </div>
              <small>Choose a date</small>
            </div>

            <div className="field-group passenger-field">
              <label htmlFor="passengers">TRAVELLERS</label>
              <div className="field-control">
                <Users size={18} />
                <select
                  id="passengers"
                  value={passengers}
                  onChange={e => setPassengers(e.target.value)}
                  aria-label="Number of passengers"
                >
                  <option>1 passenger</option>
                  <option>2 passengers</option>
                  <option>3 passengers</option>
                  <option>4 passengers</option>
                  <option>5 passengers</option>
                  <option>6 passengers</option>
                </select>
                <ChevronDown size={14} className="select-chevron" />
              </div>
              <small>Economy class</small>
            </div>

            <button className="search-button" type="submit" disabled={loading}>
              <Search size={19} />
              {loading ? 'Searching...' : 'Search flights'}
            </button>
          </form>
          <p className="search-note">
            <ShieldCheck size={15} /> Easy to explore. Simple to plan.
          </p>
        </section>

        {error && (
          <div className={`notice ${searched && flights.length ? 'notice-info' : 'notice-error'}`} role="status">
            {error}
          </div>
        )}

        {searched && (
          <section className="results-section">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">YOUR SEARCH</span>
                <h2>Flights from {origin} to {dest}</h2>
                <p>
                  {departureDate ? `Departure: ${departureDate}` : 'Available search results'}
                  {' · '}{passengers}
                </p>
              </div>
              <span className="result-count">{flights.length} result{flights.length === 1 ? '' : 's'}</span>
            </div>

            {flights.length === 0 ? (
              <div className="empty-results">
                <Plane size={30} />
                <h3>No flights found</h3>
                <p>Try another airport code or search route.</p>
              </div>
            ) : (
              <div className="flight-results">
                {flights.map((flight, index) => (
                  <article className="flight-card" key={flight.id || index}>
                    <div className="airline-info">
                      <span className="airline-mark"><Plane size={21} /></span>
                      <div>
                        <strong>{flight.airline}</strong>
                        <small>Flight {flight.id}</small>
                      </div>
                    </div>

                    <div className="flight-timing">
                      <div><strong>{flight.departure}</strong><span>{flight.origin}</span></div>
                      <div className="flight-line">
                        <small><Clock3 size={13} /> Flight</small>
                        <span />
                        <Plane size={16} />
                      </div>
                      <div className="arrival-time"><strong>{flight.arrival}</strong><span>{flight.destination}</span></div>
                    </div>

                    <div className="flight-price">
                      <small>Price per traveller</small>
                      <strong>₹{Number(flight.price).toLocaleString('en-IN')}</strong>
                      <span>Fare from the flight database</span>
                      <button
                        type="button"
                        className="search-button select-flight-button"
                        onClick={() => {
                          setSelectedFlight(flight);
                          setBookingMessage('');
                          document.getElementById('passenger-details')?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }}
                      >
                        Select flight <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedFlight && (
          <section className="results-section" id="passenger-details">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">YOUR NEXT STEP</span>
                <h2>Passenger details</h2>
                <p>{selectedFlight.airline} · {selectedFlight.origin} to {selectedFlight.destination}</p>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => setSelectedFlight(null)}
              >
                Change flight
              </button>
            </div>

            <article className="flight-card">
              <div className="flight-timing">
                <div>
                  <strong>{selectedFlight.departure}</strong>
                  <span>{selectedFlight.origin}</span>
                </div>
                <div className="flight-line">
                  <small><Clock3 size={13} /> Flight</small>
                  <span />
                  <Plane size={16} />
                </div>
                <div className="arrival-time">
                  <strong>{selectedFlight.arrival}</strong>
                  <span>{selectedFlight.destination}</span>
                </div>
              </div>
              <div className="flight-price">
                <small>Total estimated fare</small>
                <strong>
                  ₹{(
                    Number(selectedFlight.price) *
                    (Number.parseInt(passengers, 10) || 1)
                  ).toLocaleString('en-IN')}
                </strong>
                <span>For {passengers}</span>
              </div>
            </article>

            <form
              className="flight-form"
              onSubmit={async event => {
                event.preventDefault();

                if (!currentUser || !authToken) {
                  setBookingMessage('Please log in before booking your flight.');
                  setLoginOpen(true);
                  return;
                }

                if (bookingSubmitting) return;

                setBookingSubmitting(true);
                setBookingMessage('');

                try {
                  const bookingResponse = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                      flightId: String(selectedFlight.id)
                    })
                  });

                  const bookingData = await bookingResponse.json().catch(() => ({}));

                  if (!bookingResponse.ok) {
                    throw new Error(bookingData.error || 'Booking creation failed.');
                  }

                  if (!bookingData.booking || !bookingData.booking.id) {
                    throw new Error('Booking response did not include a booking ID.');
                  }

                  setCreatedBookingId(String(bookingData.booking.id));
                  setPaymentMessage('');
                  setBookingMessage(
                    `Booking created. Booking ID: ${bookingData.booking.id}. Status: ${bookingData.booking.status}. Complete the demo payment to confirm this booking.`
                  );
                } catch (error) {
                  setBookingMessage(error.message || 'Something went wrong. Please try again.');
                } finally {
                  setBookingSubmitting(false);
                }
              }}
            >
              <div className="field-group">
                <label htmlFor="traveller-name">PASSENGER FULL NAME</label>
                <div className="field-control">
                  <input
                    id="traveller-name"
                    value={travellerName}
                    onChange={event => setTravellerName(event.target.value)}
                    readOnly={Boolean(currentUser)}
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    required
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="traveller-email">EMAIL ADDRESS</label>
                <div className="field-control">
                  <input
                    id="traveller-email"
                    type="email"
                    value={travellerEmail}
                    onChange={event => setTravellerEmail(event.target.value)}
                    readOnly={Boolean(currentUser)}
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button className="search-button" type="submit" disabled={bookingSubmitting}>
                {bookingSubmitting ? 'Creating booking...' : (!currentUser ? 'Log in to book' : 'Book flight')}
                {!bookingSubmitting && <ArrowRight size={17} />}
              </button>
            </form>

            {bookingMessage && (
              <div className="notice notice-info" role="status">
                {bookingMessage}
              </div>
            )}

            {createdBookingId && (
              <div className="demo-payment-panel">
                <h3>Complete your demo booking</h3>
                <p>
                  This simulates payment only. No real money will be charged.
                </p>
                <button
                  className="search-button"
                  type="button"
                  disabled={paymentSubmitting}
                  onClick={async () => {
                    if (paymentSubmitting) return;
                    setPaymentSubmitting(true);
                    setPaymentMessage('');
                    try {
                      const response = await fetch('/api/payments', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                          bookingId: Number(createdBookingId)
                        })
                      });
                      const data = await response.json().catch(() => ({}));
                      if (!response.ok) {
                        throw new Error(data.error || data.message || 'Demo payment failed.');
                      }
                      setPaymentMessage(
                        `Demo payment successful. Booking ID: ${createdBookingId}. Status: ${data.bookingStatus || (data.booking && data.booking.status) || 'CONFIRMED'}. No real money was charged.`
                      );
                    } catch (error) {
                      setPaymentMessage(error.message || 'Demo payment failed. Please try again.');
                    } finally {
                      setPaymentSubmitting(false);
                    }
                  }}
                >
                  {paymentSubmitting ? 'Processing demo payment...' : 'Simulate Demo Payment — No Real Charge'}
                </button>
                {paymentMessage && (
                  <div className="notice notice-info" role="status">
                    {paymentMessage}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="destinations-section" id="destinations">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">A LITTLE INSPIRATION</span>
              <h2>Places worth dreaming about</h2>
              <p>Let your next destination surprise you.</p>
            </div>
            <a className="text-link" href="#flight-search">Plan a trip <ArrowRight size={16} /></a>
          </div>

          <div className="destination-grid">
            {popularDestinations.map(place => (
              <button
                className="destination-card"
                key={place.code}
                onClick={() => chooseDestination(place.code)}
                type="button"
              >
                <img src={place.image} alt={`${place.city}, ${place.country}`} loading="lazy" />
                <span className="destination-overlay" />
                <span className="destination-label">{place.label}</span>
                <span className="destination-details">
                  <span><strong>{place.city}</strong><small>{place.country}</small></span>
                  <span className="destination-arrow"><ArrowRight size={18} /></span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="benefits-section" id="why-aerobook">
          <div className="benefit-item">
            <span className="benefit-icon"><Globe2 size={22} /></span>
            <div><strong>Discover more</strong><p>Explore routes and new destinations.</p></div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon"><ShieldCheck size={22} /></span>
            <div><strong>Plan with confidence</strong><p>A simple, clear flight-search experience.</p></div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon"><Headphones size={22} /></span>
            <div><strong>Here for your journey</strong><p>Your next adventure starts with a plan.</p></div>
          </div>
        </section>
      </main>

      {loginOpen && (
        <div
          className="login-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !loginSubmitting) {
              setLoginOpen(false);
              setLoginMessage('');
            }
          }}
        >
          <section
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <button
              type="button"
              className="login-modal-close"
              aria-label="Close login"
              disabled={loginSubmitting}
              onClick={() => {
                setLoginOpen(false);
                setLoginMessage('');
              }}
            >
              ×
            </button>
            <span className="section-kicker">{authMode === 'register' ? 'NEW HERE' : 'WELCOME BACK'}</span>
            <h2 id="login-title">{authMode === 'register' ? 'Create your AeroBook account' : 'Log in to AeroBook'}</h2>
            <p>{authMode === 'register' ? 'Sign up to book your first journey.' : 'Sign in to book your next journey.'}</p>
            <form
              className="login-form"
              onSubmit={async event => {
                event.preventDefault();
                if (loginSubmitting) return;

                setLoginSubmitting(true);
                setLoginMessage('');

                try {
                  const isRegister = authMode === 'register';
                  const response = await fetch(isRegister ? '/api/users/register' : '/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(isRegister ? {
                      name: registerName.trim(),
                      email: loginEmail.trim(),
                      password: loginPassword
                    } : {
                      email: loginEmail.trim(),
                      password: loginPassword
                    })
                  });
                  const data = await response.json().catch(() => ({}));

                  if (!response.ok) {
                    throw new Error(data.error || (isRegister ? 'Sign up failed. Please try again.' : 'Login failed. Check your credentials.'));
                  }
                  if (!data.user || !data.user.id) {
                    throw new Error('Login response did not include user details.');
                  }
                  if (!data.token) {
                    throw new Error('Login response did not include an authentication token.');
                  }

                  setAuthToken(data.token);
                  setCurrentUser(data.user);
                  setTravellerName(data.user.name || '');
                  setTravellerEmail(data.user.email || loginEmail.trim());
                  setLoginPassword('');
                  setLoginEmail('');
                  setRegisterName('');
                  setAuthMode('login');
                  setLoginOpen(false);
                  setLoginMessage('');
                } catch (error) {
                  setLoginMessage(error.message || 'Unable to log in. Please try again.');
                } finally {
                  setLoginSubmitting(false);
                }
              }}
            >
              {authMode === 'register' && (
                <>
                  <label htmlFor="register-name">FULL NAME</label>
                  <input
                    id="register-name"
                    type="text"
                    value={registerName}
                    onChange={event => setRegisterName(event.target.value)}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Your full name"
                  />
                </>
              )}
              <label htmlFor="login-email">EMAIL ADDRESS</label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={event => setLoginEmail(event.target.value)}
                autoComplete="username"
                required
                placeholder="you@example.com"
              />
              <label htmlFor="login-password">PASSWORD</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={event => setLoginPassword(event.target.value)}
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={authMode === 'register' ? 8 : undefined}
                maxLength={72}
                placeholder={authMode === 'register' ? 'At least 8 characters' : 'Your account password'}
              />
              {loginMessage && (
                <div className="notice notice-info login-error" role="alert">
                  {loginMessage}
                </div>
              )}
              <button className="search-button" type="submit" disabled={loginSubmitting}>
                {loginSubmitting
                  ? (authMode === 'register' ? 'Creating account...' : 'Logging in...')
                  : (authMode === 'register' ? 'Sign up' : 'Login')}
                {!loginSubmitting && <ArrowRight size={17} />}
              </button>
              <p className="auth-switch">
                {authMode === 'register' ? 'Already have an account? ' : 'New to AeroBook? '}
                <button
                  type="button"
                  className="login-link"
                  disabled={loginSubmitting}
                  onClick={() => {
                    setAuthMode(authMode === 'register' ? 'login' : 'register');
                    setLoginMessage('');
                  }}
                >
                  {authMode === 'register' ? 'Log in' : 'Sign up'}
                </button>
              </p>
            </form>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon"><Plane size={20} /></span>
          <span>AERO<span className="brand-accent">BOOK</span></span>
        </a>
        <p>Make room for a little more adventure.</p>
        <span>© {new Date().getFullYear()} AeroBook</span>
      </footer>
    </div>
  );
}
