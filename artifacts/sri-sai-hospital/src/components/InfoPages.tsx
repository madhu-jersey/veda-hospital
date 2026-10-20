import { Fragment, useState } from 'react';
import {
  Check, ChevronDown, Clock3, MapPin, MessageCircleHeart, PhoneCall, Star, UserCheck,
} from 'lucide-react';

const phone = '+918688877831';

// Reasons to trust the hospital, kept separate from the Services list.
// Each line rests on the doctors' listed degrees, the supplied hours, the Google rating, or the reviews shown on this page.
const reasons = [
  {
    title: 'Specialist-led care',
    text: 'Care is led by doctors with postgraduate specialist degrees: M.S. Ortho and M.S. Obs & Gynaec.',
    icon: UserCheck,
  },
  {
    // [Need to confirm with hospital]
    title: 'Open day and night',
    text: 'Listed as open 24 hours, every day, with emergency and casualty care.',
    icon: Clock3,
  },
  {
    title: 'Rated 4.5 by patients',
    text: '4.5 out of 5 from 42 Google reviews, shown on this site exactly as patients wrote them.',
    icon: Star,
  },
  {
    title: 'Care explained simply',
    text: 'Patients’ reviews mention doctors who explain things in simple words, and caring, cooperative staff.',
    icon: MessageCircleHeart,
  },
  {
    title: 'One number for everything',
    text: 'Appointments, questions and emergencies all go to one number: +91 86888 77831.',
    icon: PhoneCall,
  },
  {
    title: 'Easy to reach',
    text: 'On Railway Flyover Service Road, Venkatarayapuram, with directions one tap away.',
    icon: MapPin,
  },
];

const questions = [
  {
    // [Need to confirm with hospital]
    question: "What are the hospital's opening hours?",
    answer: (
      <>The supplied hospital information lists Veda Hospital as open 24 hours a day, seven days a week.</>
    ),
  },
  {
    // [Need to confirm with hospital]
    question: 'Is casualty open at night?',
    answer: (
      <>The hospital information lists 24-hour emergency and casualty care. Please confirm current availability directly with the hospital before visiting by calling <a href={`tel:${phone}`}>+91 86888 77831</a>, or call <a href="tel:112">112</a> in an emergency.</>
    ),
  },
  {
    question: 'Which doctors are available at the hospital?',
    answer: <>The supplied details list Dr. Reddy Jyothi Krishna (M.B.B.S., M.S. Ortho) for orthopaedics and Dr. Reddy Vedavathi (M.B.B.S., M.S. Obs &amp; Gynaec) for obstetrics and gynaecology. Registration numbers and current availability need confirmation with the doctors.</>,
  },
  {
    question: 'What conditions are treated?',
    answer: <>The supplied information lists orthopaedic and joint concerns, fractures and trauma, pregnancy care, and women's health consultations. Confirm the current scope of treatments and procedures directly with the hospital.</>,
  },
  {
    question: 'How can I book an appointment?',
    answer: (
      <>Call <a href={`tel:${phone}`}>+91 86888 77831</a> to ask about appointments and doctor availability.</>
    ),
  },
  {
    // Door number and final locality wording: [Need to confirm with hospital]
    question: 'Where is Veda Hospital located?',
    answer: <>The supplied address is Railway Flyover Service Road, beside R&amp;B Office, Venkatarayapuram, Sajjapuram, Andhra Pradesh 534211. The door number and final locality wording must be confirmed with the hospital before publishing.</>,
  },
];

function Heading({ id, label, words, italic }: { id: string; label: string; words: string[]; italic: string }) {
  return (
    <header className="info-heading">
      <span className="eyebrow">{label}</span>
      <h2 id={id}>
        {words.map((word, index) => (
          <Fragment key={word}>
            <span className="info-heading-word" style={{ '--word-index': index } as React.CSSProperties}>
              <span>{word}</span>
            </span>
            {index < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
        {' '}
        <em className="info-heading-word" style={{ '--word-index': words.length } as React.CSSProperties}>
          <span>{italic}</span>
        </em>
      </h2>
    </header>
  );
}

export function WhyChooseSection() {
  return (
    <section className="info-page why-choose-page" id="why-choose" aria-labelledby="why-choose-heading">
      <div className="container info-container">
        <div className="info-intro">
          <Heading id="why-choose-heading" label="Why choose us" words={['Care', 'that', 'is']} italic="close to home." />
          <p>What patients can count on at Veda Hospital.</p>
        </div>
        <div className="reason-grid">
          {reasons.map(({ title, text, icon: Icon }, index) => (
            <article className="reason-card" key={title} style={{ '--item-index': index } as React.CSSProperties}>
              <span className="reason-icon"><Icon size={23} strokeWidth={1.6} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="info-doctors">
          <a className="info-doctor-link" href="#doctor-jyothi-krishna"><span><Check size={17} aria-hidden="true" /> Dr. Reddy Jyothi Krishna</span><ChevronDown size={17} aria-hidden="true" /></a>
          <a className="info-doctor-link" href="#doctor-vedavathi"><span><Check size={17} aria-hidden="true" /> Dr. Reddy Vedavathi</span><ChevronDown size={17} aria-hidden="true" /></a>
          <a className="button button-primary info-book-button" href={`tel:${phone}`}><PhoneCall size={17} aria-hidden="true" /> Call to book</a>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  return (
    <section className="info-page faq-page" id="faq" aria-labelledby="faq-heading">
      <div className="container info-container">
        <Heading id="faq-heading" label="FAQ" words={['Questions,']} italic="answered." />
        <div className="faq-list">
          {questions.map(({ question, answer }, index) => {
            const isOpen = openQuestion === index;
            const answerId = `faq-answer-${index + 1}`;
            return (
              <article className="faq-item" key={question} style={{ '--item-index': index } as React.CSSProperties}>
                <h3>
                  <button
                    className="faq-question"
                    id={`faq-question-${index + 1}`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenQuestion(isOpen ? null : index)}
                  >
                    <span>{question}</span>
                    <ChevronDown className="faq-chevron" size={20} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  className={`faq-answer${isOpen ? ' is-open' : ''}`}
                  id={answerId}
                  role="region"
                  aria-labelledby={`faq-question-${index + 1}`}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                >
                  <div className="faq-answer-inner"><p>{answer}</p></div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="faq-contact">Still have a question? <a href={`tel:${phone}`}>Call +91 86888 77831.</a></p>
      </div>
    </section>
  );
}
