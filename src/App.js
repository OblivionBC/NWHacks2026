import { useMemo, useState } from 'react';
import './App.css';

const PROJECTS = [
  { id: 'proj-1', name: 'nwHacks2026 Brainstorming' },
  { id: 'proj-2', name: 'school project brainstorming' },
  { id: 'proj-3', name: 'exam preparation' },
];

function App() {
  const [view, setView] = useState('home'); // 'home' | 'projects' | 'projectDetail'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectPage, setProjectPage] = useState('chat'); // 'chat' | 'history'

  const selectedProject = useMemo(
    () => PROJECTS.find((p) => p.id === selectedProjectId) || null,
    [selectedProjectId]
  );

  const currentProjectTitle = useMemo(() => {
    if (selectedProject) return selectedProject.name;
    if (selectedProjectId === 'new') return 'New Project';
    return null;
  }, [selectedProject, selectedProjectId]);

  const showProjects = () => {
    setView('projects');
    setSelectedProjectId(null);
  };

  const goHome = () => {
    setView('home');
    setSelectedProjectId(null);
    setProjectPage('chat');
  };

  const goToProject = (projectId) => {
    setSelectedProjectId(projectId);
    setView('projectDetail');
    setProjectPage('chat');
  };

  const createNewProject = () => {
    setSelectedProjectId('new');
    setView('projectDetail');
    setProjectPage('chat');
  };

  const navItems = useMemo(() => {
    if (view === 'projectDetail') {
      return [
        { id: 'back', label: 'Go back', onClick: showProjects, active: false },
        { id: 'chat', label: 'Chat', onClick: () => setProjectPage('chat'), active: projectPage === 'chat' },
        { id: 'history', label: 'View history', onClick: () => setProjectPage('history'), active: projectPage === 'history' },
      ];
    }

    if (view === 'projects') {
      return [
        { id: 'home', label: 'Go back', onClick: goHome, active: false },
        { id: 'projects-title', label: 'Projects', kind: 'title' },
        ...PROJECTS.map((project) => ({
          id: project.id,
          label: project.name,
          onClick: () => goToProject(project.id),
          active: false,
          kind: 'project',
        })),
        { id: 'create', label: 'Create a new project', onClick: createNewProject, kind: 'create' },
      ];
    }

    return [
      { id: 'home', label: 'Home', onClick: goHome, active: view === 'home' },
      { id: 'projects', label: 'Projects', onClick: showProjects, active: view === 'projects' },
    ];
  }, [view, projectPage]);

  const renderHome = () => (
    <div className="section">
      <p className="eyebrow">Welcome back</p>
      <h1>Home</h1>
      <p className="muted">
        Use the navigation to explore your projects or jump into a new chat session.
      </p>
      <div className="cta-row">
        <button className="button primary" onClick={showProjects}>
          View projects
        </button>
        <button className="button ghost" onClick={createNewProject}>
          Create new project
        </button>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="section">
      <p className="eyebrow">Workspace</p>
      <h1>Projects</h1>
      <p className="muted">Select a project from the left navigation to open it or start a new one.</p>
      <div className="panel">
        <div className="placeholder">Use the navigation to pick a project.</div>
      </div>
    </div>
  );

  const renderProjectDetail = () => {
    const title =
      selectedProject?.name || (selectedProjectId === 'new' ? 'New Project' : 'Project');

    return (
      <div className="section">
        <p className="eyebrow">Project</p>
        <h1>{title}</h1>
        <p className="muted">
          {projectPage === 'chat'
            ? 'Chat workspace for collaboration and brainstorming.'
            : 'Past activity, changes, and transcripts for this project.'}
        </p>

        {projectPage === 'chat' ? (
          <div className="panel">
            <div className="placeholder">Chat interface placeholder</div>
          </div>
        ) : (
          <div className="panel">
            <ul className="history-list">
              <li>2026-01-10 — Synced notes and generated summary.</li>
              <li>2026-01-05 — Uploaded research PDFs.</li>
              <li>2025-12-28 — Created project draft.</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">NWHacks</div>
        <nav className="nav">
          {navItems.map((item) => {
            const classes = ['nav-item'];
            if (item.kind) classes.push(item.kind);
            if (item.active) classes.push('active');

            if (item.kind === 'title') {
              return (
                <div key={item.id} className={classes.join(' ')}>
                  {item.label}
                </div>
              );
            }

            return (
              <button
                type="button"
                key={item.id}
                className={classes.join(' ')}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="nav-footer">
          <button className="nav-item danger">Log out</button>
        </div>
      </aside>

      <main className="main">
        {view === 'projectDetail' && currentProjectTitle && (
          <div className="page-banner">
            <p className="eyebrow">Active project</p>
            <h2>{currentProjectTitle}</h2>
          </div>
        )}
        {view === 'home' && renderHome()}
        {view === 'projects' && renderProjects()}
        {view === 'projectDetail' && renderProjectDetail()}
      </main>
    </div>
  );
}

export default App;
