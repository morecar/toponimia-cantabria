export default function ScanResult({ result, selected, onToggle }) {
  const { entry, matchedForm, quote } = result
  const isDifferent = matchedForm.toLowerCase() !== entry.title.toLowerCase()
  return (
    <div className={`bo-scan-result${selected ? ' bo-scan-result--selected' : ''}`} onClick={onToggle}>
      <div className="bo-scan-result-header">
        <input type="checkbox" checked={selected} onChange={onToggle} onClick={e => e.stopPropagation()} />
        <strong>{entry.title}</strong>
        {isDifferent && <span className="bo-scan-form"> ({matchedForm})</span>}
        <span className="bo-scan-hash">{entry.hash}</span>
      </div>
      <blockquote className="bo-scan-quote">{quote}</blockquote>
    </div>
  )
}
