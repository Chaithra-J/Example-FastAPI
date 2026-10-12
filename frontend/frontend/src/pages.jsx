import React, { useState, useEffect } from 'react';
import { Button, Card } from './components';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const EVALUATION_DRAFTS_KEY = "interview-evaluation-drafts";
const LEGACY_EVALUATION_DRAFT_KEY = "interview-evaluation-draft";
const COMPETENCE_LEVELS = [
  { value: 1, label: "1 - Aware" },
  { value: 2, label: "2 - Working" },
  { value: 3, label: "3 - Independent" },
  { value: 4, label: "4 - Able to check and guide others" }
];

export function loadEvaluationDrafts() {
  const savedDrafts = localStorage.getItem(EVALUATION_DRAFTS_KEY);
  if (savedDrafts !== null) {
    const parsedDrafts = JSON.parse(savedDrafts);
    if (!Array.isArray(parsedDrafts)) throw new Error("Saved drafts have an invalid format.");
    return parsedDrafts;
  }

  const legacyDraft = localStorage.getItem(LEGACY_EVALUATION_DRAFT_KEY);
  if (!legacyDraft) return [];

  const parsedLegacyDraft = JSON.parse(legacyDraft);
  if (!parsedLegacyDraft || typeof parsedLegacyDraft !== "object" || Array.isArray(parsedLegacyDraft)) {
    throw new Error("Saved draft has an invalid format.");
  }
  const migratedDraft = {
    id: `${Date.now()}-legacy`,
    data: parsedLegacyDraft,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(EVALUATION_DRAFTS_KEY, JSON.stringify([migratedDraft]));
  localStorage.removeItem(LEGACY_EVALUATION_DRAFT_KEY);
  return [migratedDraft];
}

function storeEvaluationDraft(draft) {
  const drafts = loadEvaluationDrafts();
  const existingIndex = drafts.findIndex(item => item.id === draft.id);
  if (existingIndex === -1) {
    drafts.unshift(draft);
  } else {
    drafts[existingIndex] = draft;
  }
  localStorage.setItem(EVALUATION_DRAFTS_KEY, JSON.stringify(drafts));
}

export function deleteEvaluationDraft(draftId) {
  const drafts = loadEvaluationDrafts().filter(draft => draft.id !== draftId);
  localStorage.setItem(EVALUATION_DRAFTS_KEY, JSON.stringify(drafts));
}

export function Dashboard({ onNavigateToEval, onEditDraft }) {
  const [evaluations, setEvaluations] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftError, setDraftError] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    decision: '',
    submitted_from: '',
    submitted_to: ''
  });

  useEffect(() => {
    try {
      setDrafts(loadEvaluationDrafts());
    } catch (err) {
      console.error("Error loading saved drafts:", err);
      setDraftError("Could not load saved drafts from this browser.");
    }
  }, []);

  const handleDeleteDraft = (draftId) => {
    try {
      deleteEvaluationDraft(draftId);
      setDrafts(current => current.filter(draft => draft.id !== draftId));
    } catch (err) {
      console.error("Error deleting saved draft:", err);
      setDraftError("Could not delete this draft.");
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/interviewers`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load departments");
        return res.json();
      })
      .then(setInterviewers)
      .catch(err => {
        console.error("Error fetching interviewers:", err);
        setError("Could not load department filters.");
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const queryValue = key.startsWith('submitted_')
          ? new Date(value).toISOString()
          : value;
        params.set(key, queryValue);
      }
    });
    const query = params.toString();

    setLoading(true);
    setError('');
    fetch(`${API_BASE}/api/evaluations${query ? `?${query}` : ''}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch evaluations");
        return res.json();
      })
      .then(data => {
        setEvaluations(data);
      })
      .catch(err => {
        console.error("Error fetching evaluations:", err);
        setError("Could not load evaluations. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters]);

  const departments = [...new Set(interviewers.map(interviewer => interviewer.department).filter(Boolean))];

  if (loading && evaluations.length === 0) return <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Interview Evaluations</h2>
        <Button onClick={onNavigateToEval}>+ New Evaluation</Button>
      </div>

      <Card title="Submitted Candidate Evaluations">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <label>
            Department
            <select
              value={filters.department}
              onChange={e => setFilters({ ...filters, department: e.target.value })}
              style={{ display: "block", padding: "8px", marginTop: "4px" }}
            >
              <option value="">All departments</option>
              {departments.map(department => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>
          <label>
            Decision
            <select
              value={filters.decision}
              onChange={e => setFilters({ ...filters, decision: e.target.value })}
              style={{ display: "block", padding: "8px", marginTop: "4px" }}
            >
              <option value="">All decisions</option>
              <option value="Hire">Hire</option>
              <option value="Reject">Reject</option>
              <option value="Hold">Hold</option>
            </select>
          </label>
          <label>
            Submitted from
            <input
              type="datetime-local"
              value={filters.submitted_from}
              onChange={e => setFilters({ ...filters, submitted_from: e.target.value })}
              style={{ display: "block", padding: "7px", marginTop: "4px" }}
            />
          </label>
          <label>
            Submitted to
            <input
              type="datetime-local"
              value={filters.submitted_to}
              onChange={e => setFilters({ ...filters, submitted_to: e.target.value })}
              style={{ display: "block", padding: "7px", marginTop: "4px" }}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFilters({ department: '', decision: '', submitted_from: '', submitted_to: '' })}
          >
            Clear filters
          </Button>
        </div>
        {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
        {loading ? <p>Loading evaluations...</p> : evaluations.length === 0 ? <p>No evaluations match these filters.</p> : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {evaluations.map(e => (
              <li key={e.id} style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span><strong>{e.candidate_name}</strong> ({e.position})</span>
                  <span style={{ color: e.decision === 'Hire' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{e.decision}</span>
                </div>
                <div style={{ margin: "6px 0", fontSize: "14px", color: "#374151" }}>
                  Department: <strong>{e.department || "Not specified"}</strong> | Tech: <strong>{e.technical_score}/10</strong> | Communication: <strong>{e.communication_score}/10</strong> | Interviewer ID: #{e.interviewer_id}
                </div>
                <div style={{ margin: "6px 0", fontSize: "13px", color: "#6b7280" }}>
                  Submitted: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(e.created_at) ? e.created_at : `${e.created_at}Z`))}
                </div>
                {e.feedback && <p style={{ margin: "4px 0", color: "#4b5563", fontStyle: "italic" }}>"{e.feedback}"</p>}
                {e.competences?.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <strong>Competence assessment</strong>
                    <ul style={{ paddingLeft: "20px" }}>
                      {e.competences.map(competence => (
                        <li key={competence.id} style={{ marginTop: "8px" }}>
                          <strong>{competence.competence_area}</strong>
                          {" — Required: "}{COMPETENCE_LEVELS.find(level => level.value === competence.required_level)?.label}
                          {"; Assessed: "}{COMPETENCE_LEVELS.find(level => level.value === competence.assessed_level)?.label}
                          {competence.evidence && <div><strong>Evidence:</strong> {competence.evidence}</div>}
                          {competence.observation && <div><strong>Observation:</strong> {competence.observation}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title={`Drafts (${drafts.length})`}>
        {draftError && <p role="alert" style={{ color: "#dc2626" }}>{draftError}</p>}
        {!draftError && drafts.length === 0 ? <p>No saved drafts.</p> : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {drafts.map(draft => (
              <li key={draft.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <strong>{draft.data.candidate_name || "Unnamed candidate"}</strong>
                    {draft.data.position && ` (${draft.data.position})`}
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "#6b7280" }}>
                      Saved: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.savedAt))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button type="button" onClick={() => onEditDraft(draft)}>Open draft</Button>
                    <Button type="button" variant="secondary" onClick={() => handleDeleteDraft(draft.id)}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function EvaluationForm({ onBack, draft = null }) {
  const [interviewers, setInterviewers] = useState([]);
  const [draftStatus, setDraftStatus] = useState('');
  const [draftId, setDraftId] = useState(draft?.id || null);
  const [formData, setFormData] = useState({
    candidate_name: '',
    position: '',
    interviewer_id: '',
    technical_score: 5,
    communication_score: 5,
    feedback: '',
    decision: 'Hire',
    competences: []
  });

  useEffect(() => {
    if (draft) {
      setDraftId(draft.id);
      setFormData(current => ({
        ...current,
        ...draft.data,
        competences: Array.isArray(draft.data.competences) ? draft.data.competences : []
      }));
    }
  }, [draft]);

  const updateCompetence = (index, field, value) => {
    setFormData(current => ({
      ...current,
      competences: current.competences.map((competence, competenceIndex) =>
        competenceIndex === index
          ? { ...competence, [field]: value }
          : competence
      )
    }));
  };

  const addCompetence = () => {
    setFormData(current => ({
      ...current,
      competences: [
        ...current.competences,
        { competence_area: '', required_level: 1, assessed_level: 1, evidence: '', observation: '' }
      ]
    }));
  };

  const removeCompetence = (index) => {
    setFormData(current => ({
      ...current,
      competences: current.competences.filter((_, competenceIndex) => competenceIndex !== index)
    }));
  };

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
        try {
          if (draftId) deleteEvaluationDraft(draftId);
          setDraftStatus('');
        } catch (err) {
          console.error("Evaluation submitted, but the local draft could not be removed:", err);
          setDraftStatus("Evaluation submitted, but the saved browser draft could not be removed.");
        }
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

  const handleSaveDraft = () => {
    try {
      const id = draftId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      storeEvaluationDraft({ id, data: formData, savedAt: new Date().toISOString() });
      setDraftId(id);
      onBack();
    } catch (err) {
      console.error("Error saving draft:", err);
      setDraftStatus("Could not save the draft in this browser.");
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

          <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Competence Areas</h3>
              <Button type="button" variant="secondary" onClick={addCompetence}>+ Add competence</Button>
            </div>
            {formData.competences.map((competence, index) => (
              <fieldset key={index} style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <legend>Competence {index + 1}</legend>
                <label>
                  Competence area
                  <input
                    type="text"
                    value={competence.competence_area}
                    onChange={e => updateCompetence(index, "competence_area", e.target.value)}
                    placeholder="e.g. Problem solving"
                    maxLength={150}
                    required
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </label>
                <label>
                  Required level
                  <select
                    value={competence.required_level}
                    onChange={e => updateCompetence(index, "required_level", Number(e.target.value))}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                  >
                    {COMPETENCE_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </label>
                <label>
                  Assessed level
                  <select
                    value={competence.assessed_level}
                    onChange={e => updateCompetence(index, "assessed_level", Number(e.target.value))}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                  >
                    {COMPETENCE_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </label>
                <label>
                  Evidence
                  <textarea
                    rows="2"
                    value={competence.evidence}
                    onChange={e => updateCompetence(index, "evidence", e.target.value)}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </label>
                <label>
                  Observation
                  <textarea
                    rows="2"
                    value={competence.observation}
                    onChange={e => updateCompetence(index, "observation", e.target.value)}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </label>
                <Button type="button" variant="secondary" onClick={() => removeCompetence(index)}>Remove competence</Button>
              </fieldset>
            ))}
          </section>

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
            <Button type="button" variant="secondary" onClick={handleSaveDraft}>Save as Draft</Button>
            <Button type="button" variant="secondary" onClick={onBack}>Cancel</Button>
          </div>
          {draftStatus && <p role="status" style={{ margin: 0, color: "#4b5563" }}>{draftStatus}</p>}
        </form>
      </Card>
    </div>
  );
}