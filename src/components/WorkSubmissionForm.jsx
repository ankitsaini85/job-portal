import React, { useState } from 'react';
import { buildUrl } from '../config/api';
import './WorkSubmissionForm.css';

const WorkSubmissionForm = ({ onClose, onSuccess, inline = true }) => {
  const initialFormData = {
    customerReferenceNumber: '',
    customerName: '',
    city: '',
    state: '',
    trillion: '',
    billion: '',
    million: '',
    thousand: '',
    dollar: '',
    cent: '',
    downpaymentPercent: '',
    loanPeriodYears: '',
    annualRateOfInterestPercent: '',
    purchaseValueReductionPercent: '',
    monthlyPrincipalReductionPercent: '',
    totalInterestReductionPercent: '',
    guarantorName: '',
    guarantorReferenceNumber: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to submit the form');
        setLoading(false);
        return;
      }

      console.log('[WorkSubmission] Submitting form', {
        url: buildUrl('/api/work-submission/submit'),
        hasToken: !!token,
        payload: formData
      });

      const response = await fetch(buildUrl('/api/work-submission/submit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      console.log('[WorkSubmission] Response', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit form');
      }

      setSuccess('Work submission saved successfully!');
      setTimeout(() => {
        setFormData(initialFormData);
        setSuccess('');
        if (onSuccess) onSuccess();
        if (onClose && !inline) onClose();
      }, 1500);
    } catch (err) {
      console.error('[WorkSubmission] Submit failed', err);
      setError(err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="form-grid">
      {/* Customer Information */}
      <div className="form-section">
        <h3>Customer Information</h3>
        
        <div className="form-group">
          <label htmlFor="customerReferenceNumber">
            Customer Reference Number <span className="required">*</span>
          </label>
          <input
            type="text"
            id="customerReferenceNumber"
            name="customerReferenceNumber"
            value={formData.customerReferenceNumber}
            onChange={handleChange}
            required
            placeholder="Enter customer reference number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customerName">
            Customer Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            placeholder="Enter customer name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">
              City <span className="required">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="Enter city"
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">
              State <span className="required">*</span>
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              placeholder="Enter state"
            />
          </div>
        </div>
      </div>

      {/* Amount Information */}
      <div className="form-section">
        <h3>Amount Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trillion">
              Trillion <span className="required">*</span>
            </label>
            <input
              type="number"
              id="trillion"
              name="trillion"
              value={formData.trillion}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="billion">
              Billion <span className="required">*</span>
            </label>
            <input
              type="number"
              id="billion"
              name="billion"
              value={formData.billion}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="million">
              Million <span className="required">*</span>
            </label>
            <input
              type="number"
              id="million"
              name="million"
              value={formData.million}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="thousand">
              Thousand <span className="required">*</span>
            </label>
            <input
              type="number"
              id="thousand"
              name="thousand"
              value={formData.thousand}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dollar">
              Dollar <span className="required">*</span>
            </label>
            <input
              type="number"
              id="dollar"
              name="dollar"
              value={formData.dollar}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cent">
              Cent <span className="required">*</span>
            </label>
            <input
              type="number"
              id="cent"
              name="cent"
              value={formData.cent}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="form-section">
        <h3>Loan Details</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="downpaymentPercent">
              Down Payment % <span className="required">*</span>
            </label>
            <input
              type="number"
              id="downpaymentPercent"
              name="downpaymentPercent"
              value={formData.downpaymentPercent}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="loanPeriodYears">
              Loan Period (Years) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="loanPeriodYears"
              name="loanPeriodYears"
              value={formData.loanPeriodYears}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="annualRateOfInterestPercent">
              Annual Interest Rate % <span className="required">*</span>
            </label>
            <input
              type="number"
              id="annualRateOfInterestPercent"
              name="annualRateOfInterestPercent"
              value={formData.annualRateOfInterestPercent}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="purchaseValueReductionPercent">
              Purchase Value Reduction % <span className="required">*</span>
            </label>
            <input
              type="number"
              id="purchaseValueReductionPercent"
              name="purchaseValueReductionPercent"
              value={formData.purchaseValueReductionPercent}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="monthlyPrincipalReductionPercent">
              Monthly Principal Reduction % <span className="required">*</span>
            </label>
            <input
              type="number"
              id="monthlyPrincipalReductionPercent"
              name="monthlyPrincipalReductionPercent"
              value={formData.monthlyPrincipalReductionPercent}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="totalInterestReductionPercent">
              Total Interest Reduction % <span className="required">*</span>
            </label>
            <input
              type="number"
              id="totalInterestReductionPercent"
              name="totalInterestReductionPercent"
              value={formData.totalInterestReductionPercent}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Guarantor Information */}
      <div className="form-section">
        <h3>Guarantor Information</h3>
        
        <div className="form-group">
          <label htmlFor="guarantorName">
            Guarantor Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="guarantorName"
            name="guarantorName"
            value={formData.guarantorName}
            onChange={handleChange}
            required
            placeholder="Enter guarantor name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="guarantorReferenceNumber">
            Guarantor Reference Number <span className="required">*</span>
          </label>
          <input
            type="text"
            id="guarantorReferenceNumber"
            name="guarantorReferenceNumber"
            value={formData.guarantorReferenceNumber}
            onChange={handleChange}
            required
            placeholder="Enter guarantor reference number"
          />
        </div>
      </div>
    </div>
  );

  if (inline) {
    return (
      <form className="work-submission-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: 24, fontWeight: 700 }}>
            📋 Work Submission Form
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
            Submit your loan & mortgage processing data below
          </p>
        </div>

        {formContent}

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginTop: 24 }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert" style={{ marginTop: 24 }}>
            {success}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: 24 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="work-submission-overlay">
      <div className="work-submission-modal">
        <div className="work-submission-header">
          <h2>Work Submission Form</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="work-submission-form" onSubmit={handleSubmit}>
          {formContent}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkSubmissionForm;
