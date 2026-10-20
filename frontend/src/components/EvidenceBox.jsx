export default function EvidenceBox({ evidence }) {
  const loc = evidence.file_location;
  const fileLoc = loc ? `${loc.file}${loc.line ? `:${loc.line}` : ''}` : null;
  const obs = evidence.confirmed_observations;

  return (
    <div className="evidence-box">
      <div className="evidence-badge-row">
        <span className="evidence-tag">Source: {evidence.input_source || 'User input'}</span>
        <span className="evidence-tag">Framework: {evidence.detected_framework || 'Generic JS'}</span>
        {fileLoc && <span className="evidence-tag">Origin: {fileLoc}</span>}
      </div>
      {Array.isArray(obs) && obs.length > 0 && (
        <ul className="evidence-obs-list">
          {obs.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
