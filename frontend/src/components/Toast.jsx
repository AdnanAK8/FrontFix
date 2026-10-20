export default function Toast({ message, visible }) {
  return (
    <div id="toast" className={`toast${visible ? ' show' : ''}`}>
      {message}
    </div>
  );
}
