import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const modules = [
    {
      id: 'facility',
      title: 'Facility Management',
      description: 'Manage university resources, classroom bookings, and maintenance requests in one place.',
      icon: '🏢',
      link: '/facility-management/resource-catalogue',
      action: 'Launch Dashboard'
    },
    {
      id: 'student',
      title: 'Student Portal',
      description: 'Access course materials, exam schedules, and academic records conveniently.',
      icon: '🎓',
      link: '#',
      action: 'Explore Portal',
      placeholder: true
    },
    {
      id: 'transport',
      title: 'Campus Transport',
      description: 'Track shuttle locations, view schedules, and manage parking permits.',
      icon: '🚌',
      link: '#',
      action: 'View Transit',
      placeholder: true
    }
  ];

  return (
    <main className="home-page">
      <nav className="home-navbar">
        <div className="navbar-brand">Smart Campus</div>
        <ul className="nav-links">
          <li><Link to="/" className="nav-item">Home</Link></li>
          <li><Link to="/facility-management/resource-catalogue" className="nav-item">Resources</Link></li>
          <li><a href="#" className="nav-item">Support</a></li>
        </ul>
      </nav>

      <section className="home-hero">
        <h1>Welcome to Your Smart Campus Hub</h1>
        <p>Your integrated digital companion for managing university operations with seamless efficiency and modern intelligence.</p>
      </section>

      <section className="modules-section">
        <div className="modules-grid">
          {modules.map((module) => (
            <Link 
              key={module.id} 
              to={module.link} 
              className={`module-card ${module.placeholder ? 'is-placeholder' : ''}`}
            >
              <div className="module-icon">{module.icon}</div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <div className="module-action">
                {module.action} <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
