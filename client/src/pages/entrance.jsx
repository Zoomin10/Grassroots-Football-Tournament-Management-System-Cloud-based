import React from "react";

export default function Entrance() {
  const footballTournaments = [
    { time: "09:00", title: "U12 Boys Tournament", location: "Pitch 1" },
    { time: "11:30", title: "U14 Girls Tournament", location: "Pitch 2" },
    { time: "14:00", title: "Adult 5-a-side Finals", location: "Pitch 3" },
  ];

  const otherActivities = [
    { time: "08:30", title: "Morning Yoga", location: "Studio A" },
    { time: "12:00", title: "Spin Class", location: "Studio B" },
    { time: "18:00", title: "Community Fitness Session", location: "Main Hall" },
  ];

  const sponsors = [
    "/sponsors/sponsor1.png",
    "/sponsors/sponsor2.png",
    "/sponsors/sponsor3.png",
    "/sponsors/sponsor4.png",
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <img
          src="/facility-logo.png"
          alt="Facility Logo"
          style={styles.logo}
        />
        <div>
          <h1 style={styles.title}>Today at the Sports Facility</h1>
          <div style={styles.date}>{today}</div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Football Panel */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Football Tournaments Today</h2>
          {footballTournaments.map((item, index) => (
            <div key={index} style={styles.row}>
              <span style={styles.time}>{item.time}</span>
              <span style={styles.itemTitle}>{item.title}</span>
              <span style={styles.location}>{item.location}</span>
            </div>
          ))}
        </section>

        {/* Other Activities Panel */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Other Activities Today</h2>
          {otherActivities.map((item, index) => (
            <div key={index} style={styles.row}>
              <span style={styles.time}>{item.time}</span>
              <span style={styles.itemTitle}>{item.title}</span>
              <span style={styles.location}>{item.location}</span>
            </div>
          ))}
        </section>
      </main>

      {/* Sponsors */}
      <footer style={styles.footer}>
        {sponsors.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt="Sponsor logo"
            style={styles.sponsorLogo}
          />
        ))}
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    padding: "32px 48px",
    borderBottom: "4px solid #ffcc00",
  },
  logo: {
    height: "80px",
  },
  title: {
    fontSize: "48px",
    margin: 0,
  },
  date: {
    fontSize: "24px",
    color: "#ffcc00",
  },
  main: {
    flex: 1,
    display: "grid",
    gridTemplateRows: "1fr 1fr",
  },
  panel: {
    padding: "32px 48px",
    borderBottom: "2px solid #222",
  },
  panelTitle: {
    fontSize: "36px",
    marginBottom: "24px",
    color: "#00e5ff",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 200px",
    alignItems: "center",
    padding: "12px 0",
    fontSize: "26px",
    borderBottom: "1px solid #333",
  },
  time: {
    fontWeight: "bold",
    color: "#ffcc00",
  },
  itemTitle: {
    paddingLeft: "16px",
  },
  location: {
    textAlign: "right",
    color: "#ccc",
  },
  footer: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#111",
    borderTop: "4px solid #ffcc00",
  },
  sponsorLogo: {
    maxHeight: "60px",
    filter: "brightness(1.1)",
  },
};
