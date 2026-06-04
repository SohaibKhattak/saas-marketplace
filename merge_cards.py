import os

path = r'apps/web/src/app/(dashboard)/developer/profile/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the closing Card of Profile and Header of Business
old_sep = r'''              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card className="border border-gray-200 shadow-sm rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-black" />
            Business Details
          </CardTitle>
          <CardDescription>
            Your business information displayed to potential customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">'''

new_sep = r'''              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="space-y-1 mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-black" />
              Business Details
            </h3>
            <p className="text-sm text-gray-500">
              Your business information displayed to potential customers.
            </p>
          </div>
'''

if old_sep in text:
    text = text.replace(old_sep, new_sep)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Merged Business Details into Profile Information Card")
else:
    print("Could not find the separator between Profile and Business Cards")

