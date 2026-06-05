import './NavigationBar.css'

type UserContext = {
  name: string
  current_role: string
  desired_role: string
  purpose: string
}

export default function NavigationBar({ userContext }: { userContext: UserContext }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/software-engineer.png" alt="icon" className="navbar-icon" />
        <div className="tooltip-host">
          <span className="navbar-name">{userContext.name}</span>
          <div className="tooltip">
            <div>Future Role: {userContext.desired_role}</div>
          </div>
        </div>
      </div>
    </nav>
  )
}
