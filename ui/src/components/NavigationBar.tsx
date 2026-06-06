type UserContext = {
  name: string
  current_role: string
  desired_role: string
  purpose: string
}

export default function NavigationBar({ userContext }: { userContext: UserContext }) {
  return (
    <nav className="fixed top-0 left-0 w-full h-[52px] flex items-center px-6 border-b border-black bg-white z-[100]">
      <div className="flex items-center gap-2.5">
        <img src="/software-engineer.png" alt="icon" className="h-8 w-8 object-contain" />
        <div className="relative group">
          <span className="text-[0.95rem] font-semibold cursor-default">{userContext.name}</span>
          <div className="hidden group-hover:block absolute top-[calc(100%+8px)] left-0 bg-black text-white text-[0.8rem] px-3 py-2 rounded whitespace-nowrap leading-relaxed z-[200]">
            <div>Future Role: {userContext.desired_role}</div>
          </div>
        </div>
      </div>
    </nav>
  )
}
