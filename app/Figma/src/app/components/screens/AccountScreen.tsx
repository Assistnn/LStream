import { X, Plus, Check, Mail, Trash2, ShieldCheck, Fingerprint, Lock, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface ServiceAccount {
  id: string;
  userName: string;
  email: string;
  password: string;
  tenantCode: string;
  logoUrl?: string;
  serviceName: string;
}

interface AccountScreenProps {
  serviceAccounts: ServiceAccount[];
  activeServiceAccountId: string | null;
  onClose: () => void;
  onSwitchServiceAccount: (accountId: string) => void;
  onAddServiceAccount: (userName: string, email: string, password: string, tenantCode: string) => void;
  onRemoveServiceAccount: (accountId: string) => void;
  onLogout: () => void;
}

export function AccountScreen({
  serviceAccounts,
  activeServiceAccountId,
  onClose,
  onSwitchServiceAccount,
  onAddServiceAccount,
  onRemoveServiceAccount,
  onLogout,
}: AccountScreenProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Security settings (mockup only)
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [passcodeEnabled, setPasscodeEnabled] = useState(false);

  const handleAddAccount = () => {
    if (userName && email && password && tenantCode) {
      onAddServiceAccount(userName, email, password, tenantCode);
      setUserName('');
      setEmail('');
      setPassword('');
      setTenantCode('');
      setShowAddForm(false);
    }
  };

  const handleDeleteClick = (accountId: string) => {
    setDeleteConfirmId(accountId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onRemoveServiceAccount(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const activeAccount = serviceAccounts.find(acc => acc.id === activeServiceAccountId);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white dark:bg-gray-900 z-[70] rounded-t-3xl max-w-[460px] mx-auto animate-slideUp shadow-2xl flex flex-col">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>

        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">アカウント</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Current User Profile */}
          {activeAccount && (
            <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                {/* Large Profile Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {activeAccount.userName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* User Name */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {activeAccount.userName}
                  </h2>
                  {/* Email */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                    {activeAccount.email}
                  </p>
                  {/* Service Info */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {activeAccount.logoUrl && (
                      <img
                        src={activeAccount.logoUrl}
                        alt={activeAccount.serviceName}
                        className="w-5 h-5 rounded object-contain"
                      />
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {activeAccount.serviceName} • {activeAccount.tenantCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Accounts List */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                サービスアカウント
              </h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  新規サービスアカウント
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="ユーザー名"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="テナントコード"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <input
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAccount}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setUserName('');
                        setEmail('');
                        setPassword('');
                        setTenantCode('');
                      }}
                      className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Service Accounts List */}
            <div className="space-y-2">
              {serviceAccounts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  サービスアカウントがありません
                </p>
              ) : (
                serviceAccounts.map((serviceAccount) => {
                  const isActive = activeServiceAccountId === serviceAccount.id;
                  return (
                    <div
                      key={serviceAccount.id}
                      className={`relative p-3 rounded-lg border transition-all cursor-pointer ${ 
                        isActive
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => onSwitchServiceAccount(serviceAccount.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar Circle with Initial */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${
                          isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {serviceAccount.userName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* User Name */}
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {serviceAccount.userName}
                          </h4>
                          {/* Email */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {serviceAccount.email}
                          </p>
                          {/* Service Name and Tenant */}
                          <div className="flex items-center gap-2 mt-0.5">
                            {serviceAccount.logoUrl && (
                              <img
                                src={serviceAccount.logoUrl}
                                alt={serviceAccount.serviceName}
                                className="w-4 h-4 rounded object-contain"
                              />
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {serviceAccount.serviceName} • {serviceAccount.tenantCode}
                            </p>
                          </div>
                        </div>

                        {/* Active Check Mark or Delete Button */}
                        {isActive ? (
                          <div className="flex-shrink-0 ml-2">
                            <Check className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(serviceAccount.id);
                            }}
                            className="flex-shrink-0 ml-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Security Settings Section */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-gray-900 dark:text-white" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                セキュリティ
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* Face ID / Touch ID */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Face ID / Touch ID
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      生体認証でロック解除
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBiometricEnabled(!biometricEnabled)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${ 
                    biometricEnabled 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${ 
                    biometricEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* Passcode */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      パスコードロック
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      6桁のパスコードを設定
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPasscodeEnabled(!passcodeEnabled)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${ 
                    passcodeEnabled 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${ 
                    passcodeEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="px-4 pb-6 pt-4">
            <button
              onClick={onLogout}
              className="w-full py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[80]"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl p-6 z-[90] max-w-sm w-[90%] shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              アカウントを削除
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              このサービスアカウントを削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                削除
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}