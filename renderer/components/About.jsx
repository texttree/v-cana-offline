import { useTranslation } from '@/next-i18next'

function About() {
  const { t } = useTranslation(['about'])
  return (
    <div className="p-4 xl:p-32">
      <div className="flex flex-col gap-4">
        <div className="flex justify-around gap-20">
          <div className="w-1/2 flex flex-col gap-4">
            <h2 className="font-bold">{t('about:AboutPlatform')}</h2>
            <p>{t('about:AboutPlatformContent').p1}</p>
            <p>{t('about:AboutPlatformContent').p2}</p>
            <p>{t('about:AboutPlatformContent').p3}</p>
            <p>{t('about:AboutPlatformContent').p4}</p>
          </div>
          <div className="w-1/2 flex flex-col gap-4">
            <h2 className="font-bold">{t('about:WouldLike')}</h2>
            <ul className="list-disc">
              <li>{t('about:WouldLikeContent').li1}</li>
              <li>{t('about:WouldLikeContent').li2}</li>
              <li>{t('about:WouldLikeContent').li3}</li>
            </ul>
            <h2 className="font-bold">{t('about:Experience')}</h2>
            <ul className="list-disc">
              <li>{t('about:ExperienceContent').li1}</li>
              <li>{t('about:ExperienceContent').li2}</li>
            </ul>
            <h2 className="font-bold">omg@v-cana.com</h2>
            <p>{t('about:ThankYou')}</p>
          </div>
        </div>
        <div className="flex justify-center mt-20 font-bold">
          <p>{t('about:MadeByTranslators')}</p>
        </div>
      </div>
    </div>
  )
}

export default About