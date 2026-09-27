/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// IntroSplash — the 2-second opening on the home page (Design v4).
//
//   0.00 s  logo pops in
//   0.35 s  "Your district." · "Your data." · "Your right." rise one by one
//   0.30 s  a saffron → blue → green line sweeps under them
//   1.75 s  the whole card lifts away like a curtain; the page cascades in
//
// Rules:
//   • Once per browser session (sessionStorage), home page only.
//   • Click, tap or any key skips it (IntroSkip).
//   • prefers-reduced-motion and no-JS: never shown (the inline script
//     below is what turns it on, and the CSS hides it otherwise).
//   • Tricolour stays ceremonial: a thin line and soft washes, never stripes
//     or a chakra (vault note 45).
import IntroSkip from "./IntroSkip";

const ARM = `try{var d=document.documentElement;if(sessionStorage.getItem('ftp-intro')){d.setAttribute('data-intro','seen')}else{sessionStorage.setItem('ftp-intro','1');d.setAttribute('data-intro','show')}}catch(e){}`;

export default function IntroSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <div className="ftp-intro" aria-hidden="true">
        <div className="ftp-intro-card">
          <div className="ftp-intro-logo">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="ftp-intro-word">
              ForThePeople<span className="ftp-intro-in">.in</span>
            </span>
          </div>
          <p className="ftp-intro-line">
            <span style={{ ["--i" as string]: 0 }}>Your district.</span>{" "}
            <span style={{ ["--i" as string]: 1 }} className="ftp-intro-hl">Your data.</span>{" "}
            <span style={{ ["--i" as string]: 2 }}>Your right.</span>
          </p>
          <div className="ftp-intro-bar"><span /></div>
          <p className="ftp-intro-sub">Government data from official portals, made simple for every citizen</p>
        </div>
      </div>
      <IntroSkip />
    </>
  );
}
