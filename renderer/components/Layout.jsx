import { Fragment, useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import { Transition } from '@headlessui/react'
import { Toaster } from 'react-hot-toast'

import Progress from '../public/icons/progress.svg'

function Layout({ children }) {
  const [loadingPage, setLoadingPage] = useState(false)
  const router = useRouter()

  const homePath = '/home'

  const getMainClassName = () => {
    if (router.pathname === homePath) {
      return 'mx-auto min-h-screen'
    } else {
      return 'mx-auto h-[calc(100vh-5rem)] mt-20'
    }
  }

  useEffect(() => {
    const handleStart = (url, { shallow }) => {
      if (!shallow) {
        setLoadingPage(true)
      }
    }
    router.events.on('routeChangeStart', handleStart)
    return () => {
      router.events.off('routeChangeStart', setLoadingPage(false))
    }
  }, [router])
  return (
    <>
      <div className={getMainClassName()}>
        <Transition
          as={Fragment}
          appear={true}
          show={loadingPage}
          enter="transition-opacity duration-200"
          leave="transition-opacity duration-200"
        >
          <div className="absolute flex justify-center items-center inset-0 backdrop-brightness-90 backdrop-blur z-20 overflow-y-hidden">
            {loadingPage && (
              <Progress className="progress-custom-colors w-14 animate-spin stroke-th-primary-100" />
            )}
          </div>
        </Transition>
        <main>{children}</main>
      </div>

      <Toaster />
    </>
  )
}

export default Layout
