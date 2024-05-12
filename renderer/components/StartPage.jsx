import { useTranslation } from "next-i18next";

import VcanaLogo from "../public/icons/vcana-logo-color.svg";
import { useRouter } from "next/router";

export default function StartPage() {
  const router = useRouter();

  const {
    i18n: { language: locale },
    t,
  } = useTranslation();

  const checkAgreements = () => {
    const agreements = window.electronAPI.getAgreements();
    if (Object.values(agreements).every((agreement) => agreement)) {
      router.push(`/${locale}/account`);
    } else {
      router.push(`/${locale}/agreements`);
    }
  };
  return (
    <div className="flex flex-col justify-center items-center gap-4 h-screen w-full ">
      <div>
        <div className="flex flex-grow items-center justify-center p-5  h-24 bg-white rounded-2xl cursor-pointer mb-4">
          <VcanaLogo className="w-44" />
        </div>
        <div
          className="h-32 rounded-2xl bg-slate-550"
          onClick={() => {
            checkAgreements();
          }}
        >
          <p className="p-5 lg:p-7 green-two-layers z-10 h-full w-full rounded-2xl after:rounded-2xl text-th-secondary-10 cursor-pointer">
            {t("common:SignIn")}
          </p>
        </div>
      </div>
    </div>
  );
}
