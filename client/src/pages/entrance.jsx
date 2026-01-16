import React from "react";

export default function entrance() {
  const footballTournaments = [
    { time: "09:00", title: "U12 Boys Tournament", location: "Pitch 1 (3G)" },
    { time: "11:30", title: "U14 Girls Tournament", location: "Pitch 2 (3G)" },
    { time: "14:00", title: "Adult 5-a-side Finals", location: "Pitch 3 (3G)" },
  ];

  const otherActivities = [
    { time: "12:00", title: "Petanque - Weekly Session", location: "Petanuque Court" },
    { time: "13:00", title: "Seniors Walking Football", location: "Pitch 4 (3G)" },
    { time: "14:00", title: "Community Fitness Session", location: "Grass P1" },
    { time: "18:00", title: "Girls Sessional Football", location: "Pitch 1 (3G)" },
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
     <header style={styles.header}>
  <img src="/wichelstowe.png" alt="Facility Logo" style={styles.logo} />

  <div style={styles.headerCenter}>
    <h1 style={styles.title}>Today at the Sports Hub</h1>
    <div style={styles.date}>{today}</div>
  </div>

  <img src="/wiltsfa.png" alt="Wilts FA" style={styles.headerSponsorLogo} />
</header>

      <main style={styles.main}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Football Tournaments Today</h2>
          {footballTournaments.map((item, i) => (
            <div key={i} style={styles.row}>
              <span style={styles.time}>{item.time}</span>
              <span style={styles.itemTitle}>{item.title}</span>
              <span style={styles.location}>{item.location}</span>
            </div>
          ))}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Other Activities Today</h2>
          {otherActivities.map((item, i) => (
            <div key={i} style={styles.row}>
              <span style={styles.time}>{item.time}</span>
              <span style={styles.itemTitle}>{item.title}</span>
              <span style={styles.location}>{item.location}</span>
            </div>
          ))}
        </section>
      </main>

     <footer style={styles.footer}>
  <img src="/nationwide.png" alt="Nationwide" style={styles.footerSponsorLogo} />
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
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "32px",
  padding: "22px 40px",
    backgroundColor: "#ffffff",   // NEW
  borderBottom: "4px solid #ffcc00",
},
headerCenter: {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
    alignItems: "center",   // 👈 add this
  textAlign: "center",    // 👈 and this
  paddingright: "80px",  
},

headerSponsorLogo: {
  height: "120px",
  width: "auto",
  objectFit: "contain",
},
footer: {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "26px 32px",     // bigger footer
    backgroundColor: "#ffffff",   // NEW
  borderTop: "4px solid #ffcc00",
},
footerSponsorLogo: {
  maxHeight: "90px",        // bigger logo
  width: "auto",
  objectFit: "contain",
},

  logo: { height: "120px", width: "auto" },
  title: { fontSize: "48px", alignItems: "center", paddingLeft: "60px", margin: 0 },
  date: { fontSize: "24px", color: "#e21111ff" },
  main: { flex: 1, display: "grid", gridTemplateRows: "1fr 1fr" },
  panel: { padding: "22px 48px", borderBottom: "2px solid #222" },
  panelTitle: { fontSize: "36px", marginBottom: "18px", color: "#00e5ff" },
  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 200px",
    alignItems: "center",
    padding: "12px 0",
    fontSize: "26px",
    borderBottom: "1px solid #333",
  },
  time: { fontWeight: "bold", color: "#e21111ff" },
  itemTitle: { paddingLeft: "16px" },
  location: { textAlign: "right", color: "#ccc" },
  footer: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#ffffff",  
    borderTop: "4px solid #ffcc00",
  },
  sponsorLogo: { maxHeight: "60px", filter: "brightness(1.1)" },
};
