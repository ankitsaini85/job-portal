import React, { useState } from 'react';
import { buildUrl } from '../config/api';

export default function CreateExamQuestion({ adminToken, onCreated }) {
  const [text, setText] = useState('');
  const [choiceA, setChoiceA] = useState('');
  const [choiceB, setChoiceB] = useState('');
  const [choiceC, setChoiceC] = useState('');
  const [choiceD, setChoiceD] = useState('');
  // default to first choice (0) to avoid out-of-range when admin provides only 2 choices
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e && e.preventDefault();
    const choices = [choiceA, choiceB, choiceC, choiceD].map(s => (s || '').toString()).filter(s => s);
    if (!text || choices.length < 2) return alert('Provide question text and at least 2 choices');
    if (correct < 0 || correct >= choices.length) return alert('Correct index out of range');
    setLoading(true);
    try {
      // ensure we don't exceed 40 questions
      try {
        const cntRes = await fetch(buildUrl('/api/admin/exam-questions'), { headers: { Authorization: `Bearer ${adminToken}` } });
        if (cntRes.ok) {
          const cntBody = await cntRes.json().catch(() => ({}));
          const list = cntBody.questions || [];
          if (Array.isArray(list) && list.length >= 40) {
            alert('Cannot add more than 40 questions. Delete some questions first.');
            setLoading(false);
            return;
          }
        }
      } catch (err) { /* ignore count error and proceed */ }
      const res = await fetch(buildUrl('/api/admin/exam-questions'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ text, choices, correctIndex: Number(correct) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed');
  setText(''); setChoiceA(''); setChoiceB(''); setChoiceC(''); setChoiceD(''); setCorrect(0);
      onCreated && onCreated();
    } catch (err) { alert(err.message || String(err)); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <input placeholder="Question text" value={text} onChange={(e) => setText(e.target.value)} />
      <input placeholder="Choice A" value={choiceA} onChange={(e) => setChoiceA(e.target.value)} />
      <input placeholder="Choice B" value={choiceB} onChange={(e) => setChoiceB(e.target.value)} />
      <input placeholder="Choice C (optional)" value={choiceC} onChange={(e) => setChoiceC(e.target.value)} />
      <input placeholder="Choice D (optional)" value={choiceD} onChange={(e) => setChoiceD(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>Correct index (0-based):</label>
        <input type="number" value={correct} onChange={(e) => setCorrect(Number(e.target.value))} style={{ width: 80 }} />
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Question'}</button>
        </div>
      </div>
    </form>
  );
}
