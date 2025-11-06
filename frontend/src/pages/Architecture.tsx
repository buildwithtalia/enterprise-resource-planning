export default function Architecture() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monolithic Architecture</h1>
        <p className="mt-2 text-gray-600">
          Visualizing the tightly-coupled monolithic design
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">System Architecture Diagram</h2>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-blue-300">
          {/* Single Deployable Unit */}
          <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Monolithic ERP Application</h3>
              <p className="text-sm text-gray-600 mt-1">(Single Deployable Unit)</p>
            </div>

            {/* Shared Layer */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-gray-900 mb-3 text-center">Shared Dependencies</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-1">🗄️</div>
                  <div className="text-xs font-semibold">PostgreSQL</div>
                  <div className="text-xs text-gray-600">Shared Database</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-1">🔐</div>
                  <div className="text-xs font-semibold">Auth Middleware</div>
                  <div className="text-xs text-gray-600">JWT Auth</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-1">📝</div>
                  <div className="text-xs font-semibold">Logging</div>
                  <div className="text-xs text-gray-600">Winston</div>
                </div>
              </div>
            </div>

            {/* Modules with Dependencies */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ModuleBox name="HR" icon="👥" calls={[]} calledBy={['Payroll']} />
              <ModuleBox name="Payroll" icon="💰" calls={['HR', 'Accounting']} calledBy={[]} />
              <ModuleBox name="Accounting" icon="📚" calls={[]} calledBy={['Payroll', 'Billing', 'Procurement', 'Finance']} />
              <ModuleBox name="Finance" icon="📈" calls={['Accounting']} calledBy={[]} />
              <ModuleBox name="Billing" icon="🧾" calls={['Accounting']} calledBy={[]} />
              <ModuleBox name="Procurement" icon="🛒" calls={['Accounting']} calledBy={['Inventory']} />
              <ModuleBox name="Supply Chain" icon="🚚" calls={[]} calledBy={[]} />
              <ModuleBox name="Inventory" icon="📦" calls={['Procurement']} calledBy={[]} />
            </div>
          </div>
        </div>
      </div>

      {/* Characteristics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-green-50 border-2 border-green-200">
          <h3 className="text-lg font-bold text-green-900 mb-4">✅ Advantages</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Simple deployment - single build, single deploy</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Easy development - can run entire system locally</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Direct function calls - no network overhead</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Shared code - reuse utilities and middleware</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>ACID transactions span modules</span>
            </li>
          </ul>
        </div>

        <div className="card bg-red-50 border-2 border-red-200">
          <h3 className="text-lg font-bold text-red-900 mb-4">⚠️ Disadvantages</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Tight coupling - changes affect multiple modules</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Can't scale individual modules independently</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Technology lock-in - all modules use same stack</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Large codebase becomes difficult to navigate</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Single point of failure - one crash affects all</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Cross-Coupling Details */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Cross-Coupling Examples</h3>
        <div className="space-y-4">
          <CouplingExample
            title="Payroll → HR → Accounting"
            description="When processing payroll, the Payroll module directly calls HRService to get employee data, then calls AccountingService to create journal entries"
            fileReferences={[
              'src/modules/payroll/payroll.service.ts:46',
              'src/modules/payroll/payroll.service.ts:106'
            ]}
          />

          <CouplingExample
            title="Inventory → Procurement"
            description="When stock levels reach reorder point, Inventory module automatically calls ProcurementService to create purchase orders"
            fileReferences={[
              'src/modules/inventory/inventory.service.ts:186'
            ]}
          />

          <CouplingExample
            title="Billing → Accounting"
            description="When sending an invoice, Billing module calls AccountingService to record revenue in the general ledger"
            fileReferences={[
              'src/modules/billing/billing.service.ts:161'
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function ModuleBox({ name, icon, calls, calledBy }: { name: string; icon: string; calls: string[]; calledBy: string[] }) {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold text-sm mb-2">{name}</div>
      <div className="text-xs space-y-1">
        {calls.length > 0 && (
          <div className="bg-white/20 rounded px-2 py-1">
            <div className="font-semibold">Calls:</div>
            <div>{calls.join(', ')}</div>
          </div>
        )}
        {calledBy.length > 0 && (
          <div className="bg-white/20 rounded px-2 py-1">
            <div className="font-semibold">Called by:</div>
            <div>{calledBy.join(', ')}</div>
          </div>
        )}
        {calls.length === 0 && calledBy.length === 0 && (
          <div className="text-white/60">Independent</div>
        )}
      </div>
    </div>
  )
}

function CouplingExample({ title, description, fileReferences }: { title: string; description: string; fileReferences: string[] }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-700 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2">
        {fileReferences.map((ref) => (
          <code key={ref} className="text-xs bg-gray-200 px-2 py-1 rounded">
            {ref}
          </code>
        ))}
      </div>
    </div>
  )
}
