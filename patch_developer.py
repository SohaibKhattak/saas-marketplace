import os
import sys

path = r'apps/web/src/app/(dashboard)/developer/profile/page.tsx'
full_path = os.path.join(os.getcwd(), path)
if not os.path.exists(full_path):
    print("Could not find developer profile")
    sys.exit(0)

with open(full_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add needed imports
if 'Dialog,' not in text:
    text = text.replace('import { Badge } from "@/components/ui/badge";', 'import { Badge } from "@/components/ui/badge";\nimport { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";')


start_marker = '{/* Security */}'
end_marker = '      {/* Sticky Footer */}'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_html = r'''{/* Manage Security Section */}
      <Card className="border border-gray-200 shadow-sm rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-black" />
            Manage Security
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight text-neutral-900">Password</p>
              <p className="text-sm text-gray-500">Change your password to keep your account secure.</p>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          disabled={user?.authProvider === 'GOOGLE'}
                          className="border-gray-300 hover:bg-gray-50 text-neutral-900 font-semibold tracking-tight transition-all duration-200"
                        >
                          <Lock className="mr-2 h-4 w-4" /> Change Password
                        </Button>
                      </DialogTrigger>
                      {user?.authProvider !== 'GOOGLE' && (
                        <DialogContent className="sm:max-w-[425px] rounded-sm">
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Enter your current password and a new one to update your security credentials.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {pwMessage && (
                            <div className={`flex items-center gap-2 rounded-sm p-3 text-sm animate-fade-in ${
                              pwMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {pwMessage.type === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 shrink-0" />
                              )}
                              {pwMessage.text}
                            </div>
                          )}

                          <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  id="currentPassword"
                                  type={showCurrentPw ? "text" : "password"}
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  required
                                  placeholder="Enter current password"
                                  className="h-11 pl-10 pr-10 border-gray-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neutral-900 transition-colors"
                                >
                                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  id="newPassword"
                                  type={showNewPw ? "text" : "password"}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  required
                                  minLength={8}
                                  placeholder="Min 8 characters"
                                  className="h-11 pl-10 pr-10 border-gray-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPw(!showNewPw)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neutral-900 transition-colors"
                                >
                                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  id="confirmNewPassword"
                                  type={showConfirmPw ? "text" : "password"}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                  minLength={8}
                                  placeholder="Confirm new password"
                                  className="h-11 pl-10 pr-10 border-gray-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neutral-900 transition-colors"
                                >
                                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-end pt-4">
                              <Button type="submit" className="bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 transition-all duration-200" disabled={pwSaving}>
                                {pwSaving ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                ) : (
                                  <><Lock className="mr-2 h-4 w-4" /> Save Password</>
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                </TooltipTrigger>
                {user?.authProvider === 'GOOGLE' && (
                  <TooltipContent>
                    <p>Google accounts cannot change password via this method. Please manage it via Google.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

'''
    new_content = text[:start_idx] + new_html + '\n' + text[end_idx:]
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced security section in developer profile")
else:
    print("Could not find section in developer profile")
