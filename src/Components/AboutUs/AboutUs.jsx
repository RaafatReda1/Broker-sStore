import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import "./AboutUs.css";

const AboutUs = () => {
  const { t } = useTranslation();
  const { session } = useContext(sessionContext);
  const { userData } = useContext(userDataContext);
  const { isAdmin, isModerator } = useContext(staffContext);

  const isLoggedIn = !!session;
  const isBroker = !!userData && !isAdmin && !isModerator;
  const isStaff = isAdmin || isModerator;

  return (
    <div className="about-us-container">
      {/* Language Switcher */}
      <div className="language-switcher-container">
        <LanguageSwitcher />
      </div>

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
          <h1 className="hero-title"> {t("about.title")}</h1>
          <p className="hero-subtitle">{t("about.subtitle")}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision-section">
        <div className="mission-vision-grid">
          <div className="mission-card">
            <div className="card-icon">
              <Target size={48} />
            </div>
            <h2 className="card-title">🌍 {t("about.mission.title")}</h2>
            <p className="card-description">{t("about.mission.description")}</p>
          </div>

          <div className="vision-card">
            <div className="card-icon">
              <Zap size={48} />
            </div>
            <h2 className="card-title">💡 {t("about.vision.title")}</h2>
            <p className="card-description">{t("about.vision.description")}</p>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="how-we-work-section">
        <h2 className="section-title">⚙️ {t("about.features.title")}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={40} />
            </div>
            <h3 className="feature-title">
              {t("about.features.verifiedBrokers.title")}
            </h3>
            <p className="feature-description">
              {t("about.features.verifiedBrokers.description")}
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={40} />
            </div>
            <h3 className="feature-title">
              {t("about.features.realCommissions.title")}
            </h3>
            <p className="feature-description">
              {t("about.features.realCommissions.description")}
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={40} />
            </div>
            <h3 className="feature-title">
              {t("about.features.smartManagement.title")}
            </h3>
            <p className="feature-description">
              {t("about.features.smartManagement.description")}
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Lock size={40} />
            </div>
            <h3 className="feature-title">
              {t("about.features.secureInfrastructure.title")}
            </h3>
            <p className="feature-description">
              {t("about.features.secureInfrastructure.description")}
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
          <h2 className="story-title">🕯️ {t("about.story.title")}</h2>
          <div className="story-text">
            <p>{t("about.story.description1")}</p>
            <p>{t("about.story.description2")}</p>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="values-section">
        <h2 className="section-title">{t("about.values.title")}</h2>
        <div className="values-grid">
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>{t("about.values.humanCentered")}</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>{t("about.values.verifiedNetwork")}</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>{t("about.values.realTimeTracking")}</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>{t("about.values.secureTransparent")}</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>{t("about.values.fairProfitSharing")}</span>
          </div>
          <div className="value-item">
            <CheckCircle size={24} className="check-icon" />
            <span>{t("about.values.supportSystem")}</span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">{t("about.cta.title")}</h2>
          <p className="cta-subtitle">{t("about.cta.subtitle")}</p>

          <div className="cta-buttons">
            {!isLoggedIn ? (
              <>
                <Link to="/signup" className="cta-button primary">
                  <UserPlus size={20} />
                  <span>{t("about.cta.signUpNow")}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/signin" className="cta-button secondary">
                  <span>{t("about.cta.signIn")}</span>
                </Link>
              </>
            ) : isBroker ? (
              <>
                <Link to="/balance" className="cta-button primary">
                  <TrendingUp size={20} />
                  <span>{t("about.cta.viewEarnings")}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/profile" className="cta-button secondary">
                  <span>{t("about.cta.myProfile")}</span>
                </Link>
              </>
            ) : isStaff ? (
              <>
                <Link to="/managebrokers" className="cta-button primary">
                  <Shield size={20} />
                  <span>{t("about.cta.adminDashboard")}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/manageorders" className="cta-button secondary">
                  <span>{t("about.cta.manageOrders")}</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/products" className="cta-button primary">
                  <ShoppingBag size={20} />
                  <span>{t("about.cta.startShopping")}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/profile" className="cta-button secondary">
                  <span>{t("about.cta.becomeBroker")}</span>
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
            <div className="stat-label">{t("about.stats.verifiedBrokers")}</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <ShoppingBag size={32} />
            </div>
            <div className="stat-number">10K+</div>
            <div className="stat-label">{t("about.stats.ordersProcessed")}</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Star size={32} />
            </div>
            <div className="stat-number">98%</div>
            <div className="stat-label">
              {t("about.stats.customerSatisfaction")}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
