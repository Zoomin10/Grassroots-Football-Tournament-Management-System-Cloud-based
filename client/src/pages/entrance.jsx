import React from "react";

export default function entrance() {
  const footballTournaments = [
    {
      time: "09:00",
      title: "U12 Boys Tournament",
      location: "Pitch 1 (3G)",
      providerName: "Wiltshire FA",
      providerLogo: "/wiltsfa.png",
    },
    {
      time: "11:30",
      title: "U14 Girls Tournament",
      location: "Pitch 2 (3G)",
      providerName: "Wiltshire FA",
      providerLogo: "/wiltsfa.png",
    },
    {
      time: "14:00",
      title: "Adult 5-a-side Finals",
      location: "Pitch 3 (3G)",
      providerName: "Wichelstowe Sports Hub",
      providerLogo: "/wichelstowe.png",
    },
  ];

  const otherActivities = [
    {
      time: "12:00",
      title: "Petanque - Weekly Session",
      location: "Petanque Court",
      providerName: "Petanque Club",
      providerLogo: "/wichelstowe.png",
    },
    {
      time: "13:00",
      title: "Seniors Walking Football",
      location: "Pitch 4 (3G)",
      providerName: "Walking Football Group",
      providerLogo: "/wichelstowe.png",
    },
    {
      time: "14:00",
      title: "Community Fitness Session",
      location: "Grass P1",
      providerName: "Bootcamp UK",
      providerLogo: "/bootcamp.png",
    },
    {
      time: "18:00",
      title: "Girls Sessional Football",
      location: "Pitch 1 (3G)",
      providerName: "Wroughton Youth FC",
      providerLogo: "/wroughtonyouthfc.png",
    },
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <img
          src="/wichelstowe.png"
          alt="Wichelstowe Sports Hub"
          style={styles.logo}
        />

        <div style={styles.headerCenter}>
          <h1 style={styles.title}>Today at the Sports Hub</h1>
          <div style={styles.date}>{today}</div>
        </div>

        <img
          src="/wiltsfa.png"
          alt="Wiltshire FA"
          style={styles.headerSponsorLogo}
        />
      </header>

      <main style={styles.main}>
        {/* Football Panel */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Football Tournaments Today</h2>

          <div style={styles.tableHeader}>
            <span>Time</span>
            <span>Activity</span>
            <span>Provided By</span>
            <span style={styles.headerRight}>Location</span>
           
          </div>

          {footballTournaments.map((item, i) => (
            <div key={i} style={styles.row}>
              <span style={styles.time}>{item.time}</span>
              <span style={styles.itemTitle}>{item.title}</span>
            <span style={styles.providerCell}>
  {item.providerLogo ? (
    <img
      src={item.providerLogo}
      alt={item.providerName || "Provider"}
      style={styles.providerLogo}
    />
  ) : null}
  <span style={styles.providerName}>{item.providerName}</span>
</span>

<span style={styles.location}>{item.location}</span>
            </div>
          ))}
        </section>

        {/* Other Activities Panel */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Other Activities Today</h2>

          <div style={styles.tableHeader}>
            <span>Time</span>
            <span>Activity</span>
            <span>Provided By</span>
            <span style={styles.headerRight}>Location</span>
            <span style={styles.headerRight}>Provided By</span>
          </div>

          {otherActivities.map((item, i) => (
            <div key={i} style={styles.row}>
              <span style={styles.time}>{item.time}</span>
              <span style={styles.itemTitle}>{item.title}</span>
             <span style={styles.providerCell}>
  {item.providerLogo ? (
    <img
      src={item.providerLogo}
      alt={item.providerName || "Provider"}
      style={styles.providerLogo}
    />
  ) : null}
  <span style={styles.providerName}>{item.providerName}</span>
</span>

<span style={styles.location}>{item.location}</span>
            </div>
          ))}
        </section>
      </main>

      <footer style={styles.footer}>
        <img
          src="/nationwide.png"
          alt="Nationwide"
          style={styles.footerSponsorLogo}
        />
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
    gridTemplateColumns: "120px 1fr 420px 220px",
    alignItems: "center",
    gap: "32px",
    padding: "22px 40px",
    backgroundColor: "#ffffff",
    borderBottom: "4px solid #ffcc00",
  },

  headerCenter: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",

    // Nudge to visually compensate for the larger left logo
    paddingLeft: "60px",
  },

  logo: {
    height: "80px",
    width: "auto",
    objectFit: "contain",
  },

  headerSponsorLogo: {
    height: "120px",
    width: "auto",
    objectFit: "contain",
  },

  title: {
    fontSize: "48px",
    margin: 0,
    color: "#003366",
  },

  date: {
    fontSize: "24px",
    color: "#e21111ff",
  },

  main: {
    flex: 1,
    display: "grid",
    gridTemplateRows: "1fr 1fr",
  },

  panel: {
    padding: "22px 48px",
    borderBottom: "2px solid #222",
  },

  panelTitle: {
    fontSize: "36px",
    marginBottom: "18px",
    color: "#00e5ff",
  },

  tableHeader: {
    display: "grid",
  gridTemplateColumns: "120px 1fr 420px 220px",
    alignItems: "center",
    padding: "10px 0 14px",
    fontSize: "18px",
    color: "#bbb",
    borderBottom: "1px solid #333",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  headerRight: {
    textAlign: "right",
  },

  row: {
    display: "grid",
   gridTemplateColumns: "120px 1fr 420px 220px",
    alignItems: "center",
    padding: "12px 0",
    fontSize: "26px",
    borderBottom: "1px solid #333",
  },

  time: {
    fontWeight: "bold",
    color: "#e21111ff",
  },

  itemTitle: {
    paddingLeft: "16px",
  },

  location: {
    textAlign: "right",
    color: "#ccc",
  },
providerCell: {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "12px",
},

  providerLogo: {
    height: "34px",
    width: "auto",
    objectFit: "contain",
  },

  providerName: {
    color: "#ddd",
    fontSize: "20px",
    whiteSpace: "nowrap",
  },

  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "26px 32px",
    backgroundColor: "#ffffff",
    borderTop: "4px solid #ffcc00",
  },

  footerSponsorLogo: {
    maxHeight: "90px",
    width: "auto",
    objectFit: "contain",
  },
};