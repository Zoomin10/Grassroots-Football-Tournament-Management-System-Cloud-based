import { useEffect, useState } from 'react';
import './Fixtures.css';


export default function Fixtures({ onResultsUpdated }) {
const [fixtures, setFixtures] = useState([]);

const loadFixtures = () => {
fetch('/api/matches')
.then(res => res.json())
.then(data => setFixtures(data))
.catch(err => console.error('❌ Load fixtures:', err));
};

useEffect(() => {
loadFixtures();
}, []);

const handleSubmitResult = (id, homeScore, awayScore) => {
fetch(`/api/matches/${id}/result`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
home_score: parseInt(homeScore),
away_score: parseInt(awayScore)
})
})
.then(() => {
onResultsUpdated(); // Refresh parent data (e.g., teams)
loadFixtures(); // Refresh local fixture list
})
.catch(err => {
console.error('❌ Submit result error:', err);
alert('Failed to submit result');
});
};

const handleDeleteFixture = (id) => {
if (!window.confirm('Are you sure you want to delete this fixture?')) return;

fetch(`/api/matches/${id}`, { method: 'DELETE' })
.then(() => {
onResultsUpdated();
loadFixtures();
})
.catch(err => {
console.error('❌ Delete fixture error:', err);
alert('Failed to delete fixture');
});
};

return (
<div>
<h2>Fixtures</h2>
  <div className="fixture-list">
{fixtures.map(fx => (
    <div key={fx.id} className="fixture-card">
      <div className="fixture-content">
        <div className="fixture-line fixture-teams-centered">
{fx.home_team} <span className="vs-text">vs</span> {fx.away_team}
</div>

{fx.played ? (
<div className="fixture-line fixture-score-centered">
{fx.home_score} &nbsp; - &nbsp; {fx.away_score}
</div>
) : (
<form
className="fixture-score-form"
onSubmit={e => {
e.preventDefault();
const home = e.target.home.value;
const away = e.target.away.value;
handleSubmitResult(fx.id, home, away);
}}
>
<input name="home" type="number" min="0" placeholder="Home" required />
<span>-</span>
<input name="away" type="number" min="0" placeholder="Away" required />
<button type="submit">Submit</button>
</form>
)}
      </div>

<button className="fixture-delete" onClick={() => onDelete(fixture.id)}>
🗑
</button>

      </div>

))}
  </div>
</div>
);
}