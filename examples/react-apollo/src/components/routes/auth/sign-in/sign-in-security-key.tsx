import { zodResolver } from '@hookform/resolvers/zod'
import { useSignInEmailSecurityKey } from '@nhost/react'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import SignInFooter from '@/components/auth/sign-in-footer'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const formSchema = z.object({
  email: z.string().email()
})

// Helper function to generate random challenge
function generateChallenge() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return array
}

export default function SignInSecurityKey() {
  const navigate = useNavigate()
  const { signInEmailSecurityKey } = useSignInEmailSecurityKey()
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false)
  const abortController = useRef<AbortController | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    }
  })

  const cleanup = () => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
  }

  useEffect(() => {
    const getCredentials = async () => {
      if ('credentials' in navigator && 'PublicKeyCredential' in window) {
        cleanup()
        abortController.current = new AbortController()

        try {
          // Check if WebAuthn is available
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          if (!available) {
            console.log('WebAuthn is not available on this device')
            return
          }

          const challenge = generateChallenge()

          const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname,
          }

          const credential = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
            signal: abortController.current.signal,
          }) as PublicKeyCredential

          if (credential) {
            // Try to get the email from the credential ID
            try {
              const decoder = new TextDecoder()
              const userHandle = (credential.response as AuthenticatorAssertionResponse).userHandle
              if (userHandle) {
                const email = decoder.decode(userHandle)
                if (email) {
                  form.setValue('email', email)
                }
              }
            } catch (e) {
              console.error('Error decoding credential:', e)
            }
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Error retrieving credentials:', error)
          }
        }
      }
    }


    getCredentials()
    return cleanup
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { email } = values

    cleanup()
    abortController.current = new AbortController()

    try {
      const { isError, isSuccess, needsEmailVerification, error } = await signInEmailSecurityKey(
        email
      )

      if (isError) {
        toast.error(error?.message)
      } else if (needsEmailVerification) {
        setShowEmailVerificationDialog(true)
      } else if (isSuccess) {
        // Remove the credential creation code here - we don't need to create
        // a new credential after successful sign-in
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error('Error during sign in:', error)
      toast.error('An error occurred during sign in')
    }

  }

  useEffect(() => {
    return () => cleanup()
  }, [])

  return (
    <div className="flex flex-row items-center justify-center w-screen min-h-screen bg-gray-100">
      <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-white rounded-md shadow">
        <h1 className="mb-8 text-3xl">Sign in with a security key</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="email" type="email" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button type="submit">Sign In</Button>
          </form>
        </Form>

        <Link
          to="/sign-in"
          className={cn(buttonVariants({ variant: 'link' }), 'my-2')}
          onClick={cleanup}
        >
          <ArrowLeft className="w-4 h-4" />
          Other sign-in options
        </Link>

        <Separator className="mt-2 mb-4" />

        <SignInFooter />
      </div>

      <Dialog
        open={showEmailVerificationDialog}
        onOpenChange={(open) => setShowEmailVerificationDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email verification required</DialogTitle>
          </DialogHeader>
          <p>
            You need to verify your email first. Please check your mailbox and follow the
            confirmation link to complete the registration.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
