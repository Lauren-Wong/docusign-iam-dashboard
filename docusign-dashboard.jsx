import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Clock, Users, Zap, ChevronRight, RefreshCw } from 'lucide-react';

// Mock data generator for workflows
const generateMockWorkflows = () => [
  {
    id: 'wf-001',
    name: 'Employee Onboarding - IT Access Provisioning',
    status: 'healthy',
    completionRate: 98.5,
    avgDuration: '2.3m',
    lastRun: '5 min ago',
    executions: 342,
    failures: 5,
    trend: 'up',
    issues: []
  },
  {
    id: 'wf-002',
    name: 'Contractor Access Request & Approval',
    status: 'warning',
    completionRate: 87.2,
    avgDuration: '8.7m',
    lastRun: '12 min ago',
    executions: 156,
    failures: 20,
    trend: 'down',
    issues: [
      { type: 'warning', message: 'Approval timeout rate increasing (15% last 24h)' },
      { type: 'info', message: 'Average response time 3x baseline' }
    ]
  },
  {
    id: 'wf-003',
    name: 'Quarterly Access Review & Recertification',
    status: 'critical',
    completionRate: 62.8,
    avgDuration: '45.2m',
    lastRun: '2 hours ago',
    executions: 89,
    failures: 33,
    trend: 'down',
    issues: [
      { type: 'error', message: 'API connection failures to AD (12 failures in last hour)' },
      { type: 'error', message: 'Conditional routing logic failing for managers with >50 reports' },
      { type: 'warning', message: 'Envelope expiration before completion (8 instances)' }
    ]
  },
  {
    id: 'wf-004',
    name: 'Offboarding - Access Revocation',
    status: 'healthy',
    completionRate: 99.1,
    avgDuration: '1.8m',
    lastRun: '8 min ago',
    executions: 278,
    failures: 3,
    trend: 'stable',
    issues: []
  },
  {
    id: 'wf-005',
    name: 'Role Change - Permission Update',
    status: 'warning',
    completionRate: 91.5,
    avgDuration: '5.2m',
    lastRun: '18 min ago',
    executions: 203,
    failures: 17,
    trend: 'stable',
    issues: [
      { type: 'warning', message: 'Recipient routing delay in 12% of workflows' }
    ]
  }
];

const recommendations = {
  'wf-002': [
    {
      priority: 'high',
      action: 'Reduce approval timeout from 48h to 24h to prevent workflow abandonment',
      impact: 'Could improve completion rate by ~8-10%'
    },
    {
      priority: 'medium',
      action: 'Add reminder notifications at 12h and 20h marks',
      impact: 'Reduce average response time'
    }
  ],
  'wf-003': [
    {
      priority: 'critical',
      action: 'Implement retry logic with exponential backoff for AD API calls',
      impact: 'Should reduce API failures by 80%+'
    },
    {
      priority: 'critical',
      action: 'Split large manager review batches into sub-workflows (threshold: 25 reports)',
      impact: 'Fix routing logic failures'
    },
    {
      priority: 'high',
      action: 'Extend envelope expiration from 7 to 14 days for quarterly reviews',
      impact: 'Prevent premature expiration'
    }
  ],
  'wf-005': [
    {
      priority: 'medium',
      action: 'Optimize parallel processing for permission updates',
      impact: 'Reduce routing delays'
    }
  ]
};

export default function DocuSignDashboard() {
  const [workflows, setWorkflows] = useState(generateMockWorkflows());
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return 'rgb(16, 185, 129)';
      case 'warning': return 'rgb(245, 158, 11)';
      case 'critical': return 'rgb(239, 68, 68)';
      default: return 'rgb(107, 114, 128)';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return <CheckCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'critical': return <XCircle size={20} />;
      default: return <Activity size={20} />;
    }
  };

  const healthyCount = workflows.filter(w => w.status === 'healthy').length;
  const warningCount = workflows.filter(w => w.status === 'warning').length;
  const criticalCount = workflows.filter(w => w.status === 'critical').length;
  const avgCompletion = (workflows.reduce((sum, w) => sum + w.completionRate, 0) / workflows.length).toFixed(1);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
      color: '#e2e8f0',
      padding: '2rem'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .workflow-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .workflow-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .recommendation-item {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>

      {/* Header */}
      <div style={{
        marginBottom: '2.5rem',
        animation: 'fadeInUp 0.5s ease-out'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em'
            }}>
              Maestro Workflow Health
            </h1>
            <p style={{
              margin: 0,
              color: '#94a3b8',
              fontSize: '0.95rem'
            }}>
              DocuSign IAM Workflow Monitoring & Intelligence
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <RefreshCw size={16} style={{ color: '#60a5fa', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            animationDelay: '0.1s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>
                  Healthy Workflows
                </p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'rgb(16, 185, 129)' }}>
                  {healthyCount}
                </p>
              </div>
              <CheckCircle size={32} style={{ color: 'rgb(16, 185, 129)', opacity: 0.5 }} />
            </div>
          </div>

          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            animationDelay: '0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>
                  Needs Attention
                </p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'rgb(245, 158, 11)' }}>
                  {warningCount}
                </p>
              </div>
              <AlertTriangle size={32} style={{ color: 'rgb(245, 158, 11)', opacity: 0.5 }} />
            </div>
          </div>

          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            animationDelay: '0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>
                  Critical Issues
                </p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'rgb(239, 68, 68)' }}>
                  {criticalCount}
                </p>
              </div>
              <XCircle size={32} style={{ color: 'rgb(239, 68, 68)', opacity: 0.5 }} />
            </div>
          </div>

          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            animationDelay: '0.4s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>
                  Avg Completion
                </p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'rgb(96, 165, 250)' }}>
                  {avgCompletion}%
                </p>
              </div>
              <TrendingUp size={32} style={{ color: 'rgb(96, 165, 250)', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedWorkflow ? '1fr 450px' : '1fr',
        gap: '2rem',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        {/* Workflows List */}
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            color: '#f1f5f9'
          }}>
            Active Workflows
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workflows.map((workflow, index) => (
              <div
                key={workflow.id}
                className="workflow-card"
                onClick={() => setSelectedWorkflow(workflow)}
                style={{
                  background: selectedWorkflow?.id === workflow.id 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedWorkflow?.id === workflow.id
                    ? '1px solid rgba(96, 165, 250, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ color: getStatusColor(workflow.status) }}>
                        {getStatusIcon(workflow.status)}
                      </div>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#f1f5f9'
                      }}>
                        {workflow.name}
                      </h3>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>
                      {workflow.id}
                    </p>
                  </div>
                  
                  <ChevronRight 
                    size={20} 
                    style={{ 
                      color: '#64748b',
                      transform: selectedWorkflow?.id === workflow.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }} 
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Completion
                    </p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: getStatusColor(workflow.status) }}>
                      {workflow.completionRate}%
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Avg Duration
                    </p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#cbd5e1' }}>
                      {workflow.avgDuration}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Executions
                    </p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#cbd5e1' }}>
                      {workflow.executions}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Failures
                    </p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: workflow.failures > 10 ? 'rgb(239, 68, 68)' : '#cbd5e1' }}>
                      {workflow.failures}
                    </p>
                  </div>
                </div>

                {workflow.issues.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', fontWeight: '500' }}>
                      ⚠ {workflow.issues.length} issue{workflow.issues.length > 1 ? 's' : ''} detected
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedWorkflow && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            height: 'fit-content',
            position: 'sticky',
            top: '2rem',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#f1f5f9'
              }}>
                Workflow Details
              </h2>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                {selectedWorkflow.name}
              </p>
            </div>

            {/* Issues Section */}
            {selectedWorkflow.issues.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                  Current Issues
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedWorkflow.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="recommendation-item"
                      style={{
                        padding: '1rem',
                        background: issue.type === 'error' 
                          ? 'rgba(239, 68, 68, 0.1)' 
                          : 'rgba(245, 158, 11, 0.1)',
                        border: `1px solid ${issue.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#e2e8f0',
                        animationDelay: `${idx * 0.1}s`
                      }}
                    >
                      {issue.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {recommendations[selectedWorkflow.id] && (
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Zap size={18} style={{ color: '#60a5fa' }} />
                  Recommendations
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recommendations[selectedWorkflow.id].map((rec, idx) => (
                    <div
                      key={idx}
                      className="recommendation-item"
                      style={{
                        padding: '1.25rem',
                        background: 'rgba(96, 165, 250, 0.1)',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        borderRadius: '12px',
                        animationDelay: `${(selectedWorkflow.issues.length + idx) * 0.1}s`
                      }}
                    >
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: rec.priority === 'critical' 
                          ? 'rgba(239, 68, 68, 0.2)' 
                          : rec.priority === 'high'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(96, 165, 250, 0.2)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem',
                        color: rec.priority === 'critical' 
                          ? '#fca5a5' 
                          : rec.priority === 'high'
                          ? '#fcd34d'
                          : '#93c5fd'
                      }}>
                        {rec.priority}
                      </div>
                      
                      <p style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#f1f5f9',
                        lineHeight: '1.5'
                      }}>
                        {rec.action}
                      </p>
                      
                      <p style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        fontStyle: 'italic'
                      }}>
                        💡 {rec.impact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedWorkflow.issues.length === 0 && !recommendations[selectedWorkflow.id] && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <CheckCircle size={48} style={{ color: 'rgb(16, 185, 129)', marginBottom: '1rem' }} />
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  No issues detected. Workflow is running smoothly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
