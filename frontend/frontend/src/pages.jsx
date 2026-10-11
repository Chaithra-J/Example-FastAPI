import React, { useState, useEffect } from 'react';
import { Button, Card } from './components';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Dashboard({ onNavigateToEval }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/evaluations`)
      .then(res => res.json())
      .then(data => {
        setEvaluations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching evaluations:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Interview Evaluations</h2>
        <Button onClick={onNavigateToEval}>+ New Evaluation</Button>
      </div>

      <Card title="Submitted Candidate Evaluations">
        {evaluations.length === 0 ? <p>No evaluations submitted yet.</p> : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {evaluations.map(e => (
              <li key={e.id} style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span><strong>{e.candidate_name}</strong> ({e.position}) - <em style={{ color: "#6b7280" }}>{e.candidate_email}</em></span>
                  <span style={{ color: e.decision === 'Hire' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{e.decision}</span>
                </div>
                <div style={{ margin: "6px 0", fontSize: "14px", color: "#374151" }}>
                  Tech: <strong>{e.technical_score}/10</strong> | Communication: <strong>{e.communication_score}/10</strong> | Interviewer ID: #{e.interviewer_id}
                </div>
                {e.feedback && <p style={{ margin: "4px 0", color: "#4b5563", fontStyle: "italic" }}>"{e.feedback}"</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function EvaluationForm({ onBack }) {
  const [interviewers, setInterviewers] = useState([]);
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    position: '',
    interviewer_id: '',
    technical_score: 5,
    communication_score: 5,
    feedback: '',
    decision: 'Hire'
  });

  // useEffect(() => {
  //   fetch(`${API_BASE}/api/interviewers`).then(res => res.json()).then(setInterviewers);
  // }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/interviewers`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch interviewers");
        return res.json();
      })
      .then(data => {
        console.log("Fetched interviewers successfully:", data);
        setInterviewers(data);
      })
      .catch(err => {
        console.error("Error fetching interviewers:", err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          interviewer_id: Number(formData.interviewer_id),
          technical_score: Number(formData.technical_score),
          communication_score: Number(formData.communication_score)
        })
      });
      if (res.ok) {
        alert("Evaluation submitted successfully!");
        onBack();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error connecting to backend.");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>New Candidate Evaluation</h2>
      <Card>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Candidate Name</label>
            <input 
              type="text"
              value={formData.candidate_name} 
              onChange={e => setFormData({...formData, candidate_name: e.target.value})}
              placeholder="e.g. Jane Doe"
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Candidate Email</label>
            <input 
              type="email"
              value={formData.candidate_email} 
              onChange={e => setFormData({...formData, candidate_email: e.target.value})}
              placeholder="e.g. jane@example.com"
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Position Applied For</label>
            <input 
              type="text"
              value={formData.position} 
              onChange={e => setFormData({...formData, position: e.target.value})}
              placeholder="e.g. Full Stack Developer"
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Interviewer</label>
            <select 
              value={formData.interviewer_id} 
              onChange={e => setFormData({...formData, interviewer_id: e.target.value})}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
            >
              <option value="">Select Interviewer</option>
              {interviewers.map(i => <option key={i.id} value={i.id}>{i.name} ({i.department || 'General'})</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Technical Score (1-10): {formData.technical_score}</label>
            <input 
              type="range" min="1" max="10" 
              value={formData.technical_score}
              onChange={e => setFormData({...formData, technical_score: e.target.value})}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Communication Score (1-10): {formData.communication_score}</label>
            <input 
              type="range" min="1" max="10" 
              value={formData.communication_score}
              onChange={e => setFormData({...formData, communication_score: e.target.value})}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Feedback Notes</label>
            <textarea 
              rows="4"
              value={formData.feedback}
              onChange={e => setFormData({...formData, feedback: e.target.value})}
              placeholder="Write detailed assessment..."
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Decision</label>
            <select 
              value={formData.decision}
              onChange={e => setFormData({...formData, decision: e.target.value})}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
            >
              <option value="Hire">Hire</option>
              <option value="Reject">Reject</option>
              <option value="Hold">Hold</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <Button type="submit">Submit Evaluation</Button>
            <Button type="button" variant="secondary" onClick={onBack}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}