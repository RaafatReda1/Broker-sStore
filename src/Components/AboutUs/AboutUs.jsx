import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Target,
  Zap,
  Heart,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Lock,
  TrendingUp,
  UserPlus,
  ShoppingBag,
  Briefcase,
} from "lucide-react";
import {
  sessionContext,
  userDataContext,
  staffContext,
} from "../../AppContexts";
import "./AboutUs.css";

const AboutUs = () => {
  const { session } = useContext(sessionContext);
  const { userData } = useContext(userDataContext);
  const { isAdmin, isModerator } = useContext(staffContext);

  const isLoggedIn = !!session;
  const isBroker = !!userData && !isAdmin && !isModerator;
  const isStaff = isAdmin || isModerator;

  return (
    <div className="about-us-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img
              src="/CicadaHorizentalWhite.png"
              alt="Cicada Logo"
              className="cicada-logo"
            />
          </div>
          <h1 className="hero-title">About <span className="brand-name">Cicada</span>
          </h1>
          <p className="hero-subtitle">
            Cicada isn&apos;t just another e-commerce platform — it&apos;s a
            bridge between people and opportunity. We believe that trust,
            transparency, and human connection are the core of every successful
            deal.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision-section">
        <div className="mission-vision-grid">
          <div className="mission-card">
            <div className="card-icon">
              <Target size={48} />
            </div>
            <h2 className="card-title">🌍 Our Mission</h2>
            <p className="card-description">
              To redefine online trade by merging technology with human trust —
              creating a fair ecosystem where brokers, customers, and businesses
              all grow together.
            </p>
          </div>

          <div className="vision-card">
            <div className="card-icon">
              <Zap size={48} />
            </div>
            <h2 className="card-title">💡 Our Vision</h2>
            <p className="card-description">
              To build the world&apos;s most trusted broker-driven marketplace,
              where anyone with passion and integrity can become a key player in
              digital commerce.
            </p>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="how-we-work-section">
        <h2 className="section-title">⚙️ How We Work</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={40} />
            </div>
            <h3 className="feature-title">Verified Brokers</h3>
            <p className="feature-description">
              Every broker is identity-verified for full transparency and trust.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={40} />
            </div>
            <h3 className="feature-title">Real Commissions</h3>
            <p className="feature-description">
              Brokers earn fair profits for every successful order they
              facilitate.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={40} />
            </div>
            <h3 className="feature-title">Smart Management</h3>
            <p className="feature-description">
              A powerful admin system ensures smooth operations and quality
              control.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Lock size={40} />
            </div>
            <h3 className="feature-title">Secure Infrastructure</h3>
            <p className="feature-description">
              Powered by Supabase and React, ensuring reliability and real-time
              performance.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="story-section">
        <div className="story-content">
          <div className="story-icon">
            <Heart size={60} />
          </div>
          <h2 className="story-title">🕯️ Our Story</h2>
          <div className="story-text">
            <p>
              The name <strong>Cicada</strong> is inspired by the mystery and
              intelligence of Cicada 3301 — a symbol of curiosity, persistence,
              and problem-solving.
            </p>
            <p>
              Just like the cicada&apos;s hidden emergence after years
              underground, we believe in quietly building powerful systems that
              rise when ready — changing how digital trade works forever.
            </p>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="values-section">
        <h2 className="section-title">Why Choose Cicada?</h2>
        <div className="values-grid">
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>Human-centered commerce</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>Verified broker network</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>Real-time commission tracking</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>Secure and transparent</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>Fair profit sharing</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>24/7 support system</span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Join the Future of Commerce?</h2>
          <p className="cta-subtitle">
            At Cicada, we don&apos;t just build software. We build connections,
            trust, and opportunities — one deal at a time.
          </p>

          <div className="cta-buttons">
            {!isLoggedIn ? (
              <>
                <Link to="/signup" className="cta-button primary">
                  <UserPlus size={20} />
                  <span>Sign Up Now</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/signin" className="cta-button secondary">
                  <span>Sign In</span>
                </Link>
              </>
            ) : isBroker ? (
              <>
                <Link to="/balance" className="cta-button primary">
                  <TrendingUp size={20} />
                  <span>View My Earnings</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/profile" className="cta-button secondary">
                  <span>My Profile</span>
                </Link>
              </>
            ) : isStaff ? (
              <>
                <Link to="/managebrokers" className="cta-button primary">
                  <Shield size={20} />
                  <span>Manage Brokers</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/manageorders" className="cta-button secondary">
                  <span>Manage Orders</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/products" className="cta-button primary">
                  <ShoppingBag size={20} />
                  <span>Start Shopping</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/profile" className="cta-button secondary">
                  <span>Become a Broker</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-number">500+</div>
            <div className="stat-label">Verified Brokers</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <ShoppingBag size={32} />
            </div>
            <div className="stat-number">10K+</div>
            <div className="stat-label">Orders Processed</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Star size={32} />
            </div>
            <div className="stat-number">98%</div>
            <div className="stat-label">Customer Satisfaction</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
