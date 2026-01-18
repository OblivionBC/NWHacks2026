import { useMemo, useState, useEffect } from 'react';
import branchLogo from './branch.svg';
import './App.css';
import ChatInterface from './ChatInterface';
import TreeVisualization from './TreeVisualization';
import { api } from './api';

// Projects will be loaded from API
// const PROJECTS = [];

const HOME_FEATURES = [
  {
    title: 'Save points',
    body: 'Capture checkpoints mid-convo so you can branch later without losing context.',
  },
  {
    title: 'Branch boldly',
    body: 'Fork new directions in parallel and explore ideas like GitFlow for chats.',
  },
  {
    title: 'Compare + merge',
    body: 'Line up outcomes, keep the best path, and jump back to any version instantly.',
  },
];

function App() {
  const [view, setView] = useState('home'); // 'home' | 'projects' | 'projectDetail'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectPage, setProjectPage] = useState('chat'); // 'chat' | 'history'
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const loadedProjects = await api.getAllProjects();
      setProjects(loadedProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [selectedProjectId, projects]
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

  const createNewProject = async () => {
    try {
      console.log('Creating new project...');
      const newProject = await api.createProject('New Project', 'A fresh idea workspace');
      console.log('Project created:', newProject);
      setProjects([...projects, newProject]);
      setSelectedProjectId(newProject.id);
      setView('projectDetail');
      setProjectPage('chat');
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project. Make sure the backend server is running on port 3001 and MongoDB is running.');
    }
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
        ...projects.map((project) => ({
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
  }, [view, projectPage, projects]);

  const renderHome = () => (
    <div className="home">
      <div className="hero">
        <div className="hero-header">
          <div className="logo-mark">
            <img src={branchLogo} alt="ThoughtTree branch logo" />
          </div>
          <div>
            <p className="eyebrow">ThoughtTree</p>
            <h1>Conversations that branch like code.</h1>
          </div>
        </div>
        <p className="lead">
          Our AI chat treats conversations like version-controlled code. Drop save points, branch off,
          compare outcomes, and return to any version instantly — perfect for brainstorming, learning, writing,
          and problem-solving.
        </p>
        <div className="pill-row">
          <span className="pill">Save</span>
          <span className="pill">Branch</span>
          <span className="pill">Compare</span>
          <span className="pill">Merge</span>
        </div>
        <div className="cta-row">
          <button className="button primary" onClick={createNewProject}>
            Start a new project
          </button>
          <button className="button ghost" onClick={showProjects}>
            Browse projects
          </button>
        </div>
      </div>

      <div className="home-grid">
        {HOME_FEATURES.map((item) => (
          <div key={item.title} className="home-card">
            <p className="feature-title">{item.title}</p>
            <p className="muted">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="branch-anim" aria-hidden="true">
        <svg viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c6bff" />
              <stop offset="45%" stopColor="#6ff2d6" />
              <stop offset="80%" stopColor="#ffb347" />
            </linearGradient>
          </defs>
          <path className="branch-path trunk" d="M0 320 C 40 300, 85 260, 140 240" />
          <path
            className="branch-path main"
            d="M140 240 C 220 210, 320 185, 430 190 C 560 195, 700 200, 840 195 C 980 190, 1100 205, 1200 195"
          />
          <path className="branch-path twig1" d="M260 202 C 300 165, 350 140, 400 142" />
          <path className="branch-path twig2" d="M360 192 C 420 240, 470 255, 520 240" />
          <path className="branch-path twig3" d="M520 192 C 570 155, 630 138, 690 145" />
          <path className="branch-path twig4" d="M660 197 C 720 238, 790 255, 850 242" />
          <path className="branch-path twig5" d="M820 195 C 880 160, 940 145, 1000 150" />
          <path className="branch-path twig6" d="M930 198 C 990 232, 1060 244, 1120 232" />

          <path className="branch-path sprig1" d="M400 142 C 420 124, 440 116, 462 120" />
          <path className="branch-path sprig2" d="M520 240 C 545 262, 565 272, 590 265" />
          <path className="branch-path sprig3" d="M690 145 C 712 126, 734 116, 760 122" />
          <path className="branch-path sprig4" d="M850 242 C 870 264, 895 274, 918 268" />
          <path className="branch-path sprig5" d="M1000 150 C 1022 132, 1042 125, 1064 130" />
          <path className="branch-path sprig6" d="M1120 232 C 1144 252, 1168 260, 1190 255" />
        </svg>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="section">
      <p className="eyebrow">Workspace</p>
      <h1>Projects</h1>
      <p className="muted">Select a project from the left navigation to open it or start a new one.</p>
      <div className="panel">
        {isLoadingProjects ? (
          <div className="placeholder">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="placeholder">
            <p>No projects yet. Click "Create a new project" to get started!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card" onClick={() => goToProject(project.id)}>
                <h3>{project.name}</h3>
                <p className="muted">{project.description || 'No description'}</p>
                <p className="project-date">Created {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProjectDetail = () => {
    const title = selectedProject?.name || 'New Project';

    if (!selectedProjectId || selectedProjectId === 'new') {
      return (
        <div className="section">
          <p className="eyebrow">Project</p>
          <h1>Creating Project...</h1>
        </div>
      );
    }

    return (
      <div className="section">
        <p className="eyebrow">Project</p>
        <h1>{title}</h1>
        <p className="muted">
          {projectPage === 'chat'
            ? 'Chat workspace for collaboration and brainstorming.'
            : 'Visualize your conversation tree and navigate between branches.'}
        </p>

        {projectPage === 'chat' ? (
          <ChatInterface
            projectId={selectedProjectId}
            projectName={title}
            onChatIdChange={setCurrentChatId}
          />
        ) : (
          <div className="panel tree-panel">
            <TreeVisualization
              chatId={currentChatId}
              onNodeClick={(nodeId) => {
                console.log('Node clicked:', nodeId);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={branchLogo} alt="ThoughtTree logo" />
          <span>ThoughtTree</span>
        </div>
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
