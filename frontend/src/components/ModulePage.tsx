import { ReactNode } from 'react'

interface ModulePageProps {
  title: string
  icon: string
  description: string
  children: ReactNode
  calls?: string[]
  calledBy?: string[]
}

export default function ModulePage({ title, icon, description, children, calls = [], calledBy = [] }: ModulePageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="text-6xl">{icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-600">{description}</p>
          </div>
        </div>
      </div>

      {/* Dependencies */}
      {(calls.length > 0 || calledBy.length > 0) && (
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Module Dependencies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calls.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-2">This module calls:</p>
                <div className="flex flex-wrap gap-2">
                  {calls.map((module) => (
                    <span key={module} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      → {module}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {calledBy.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-2">Called by:</p>
                <div className="flex flex-wrap gap-2">
                  {calledBy.map((module) => (
                    <span key={module} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {module} →
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  )
}
