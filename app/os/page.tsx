export default function StartupOSDashboard() {
  const commands = [
    { cmd: 'DAILY BRIEF', desc: 'Scout + Validator + CEO samenvatting' },
    { cmd: 'SHIP IT: [feature]', desc: 'CTO bouwt, Validator checkt, CEO keurt goed' },
    { cmd: 'WAR ROOM: [probleem]', desc: 'Alle agents actief' },
    { cmd: 'AUDIT', desc: 'Codebase + markt + roadmap check' },
    { cmd: 'RED TEAM', desc: 'Businessmodel stress test' },
    { cmd: 'SPRINT', desc: 'Weekplan + taakverdeling' },
  ]

  const agents = [
    { name: 'CEO', emoji: '🧠', role: 'Beslissingen · coördinatie · SITREP', color: 'bg-purple-50 border-purple-200' },
    { name: 'CTO', emoji: '⚙️', role: 'Autonoom bouwen vanuit BACKLOG.md', color: 'bg-teal-50 border-teal-200' },
    { name: 'Scout', emoji: '🔍', role: 'Markt · concurrenten · risico\'s', color: 'bg-amber-50 border-amber-200' },
    { name: 'Validator', emoji: '✅', role: 'Fit check · scorecard · RED TEAM', color: 'bg-red-50 border-red-200' },
  ]

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Servr OS</h1>
        <p className="text-sm text-gray-500">Multi-agent systeem — praat met de CEO via Claude Code</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {agents.map(a => (
          <div key={a.name} className={`border rounded-xl p-4 ${a.color}`}>
            <p className="font-medium">{a.emoji} {a.name}</p>
            <p className="text-sm text-gray-600 mt-1">{a.role}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-xl p-5">
        <p className="font-medium mb-3">Trigger commando&apos;s</p>
        <div className="space-y-2">
          {commands.map(c => (
            <div key={c.cmd} className="flex gap-3 text-sm">
              <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap">{c.cmd}</code>
              <span className="text-gray-600">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border rounded-xl p-5">
        <p className="font-medium mb-2">Data flow</p>
        <p className="text-sm text-gray-600">Scout → BACKLOG.md → Validator → APPROVED_TASKS → CEO → SPRINT_QUEUE → CTO bouwt autonoom</p>
      </div>
    </main>
  )
}
