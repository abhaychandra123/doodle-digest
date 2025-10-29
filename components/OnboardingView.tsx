import React, { useState, createContext, useContext } from 'react';
import { GroupDraft } from '../types';
import OnboardingCreateGroup from './OnboardingCreateGroup';
import OnboardingPurpose from './OnboardingPurpose';
import OnboardingStructure from './OnboardingStructure';
import OnboardingTools from './OnboardingTools';
import OnboardingReview from './OnboardingReview';

interface OnboardingContextType {
  groupDraft: GroupDraft;
  setGroupDraft: React.Dispatch<React.SetStateAction<GroupDraft>>;
  user: { name: string; email: string };
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);
export const useOnboardingState = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingState must be used within an OnboardingProvider');
  }
  return context;
};

const initialDraft: GroupDraft = {
  name: '',
  description: '',
  purpose: '',
  categories: [],
  privacy: 'Private',
  members: [
    { id: 'user-1', name: 'You', role: 'Lead Researcher' },
    { id: 'user-2', name: 'Jane Doe', role: 'Contributor' }
  ],
  tools: [],
  template: undefined,
};


interface OnboardingViewProps {
  onComplete: () => void;
  onExit: () => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onExit }) => {
  const [step, setStep] = useState(1);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(initialDraft);

  const contextValue = {
    groupDraft,
    setGroupDraft,
    user: { name: 'You', email: 'your-email@example.com' }, // Placeholder user
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  const goToStep = (targetStep: number) => {
    if (targetStep >= 1 && targetStep <= 5) {
      setStep(targetStep);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <OnboardingCreateGroup nextStep={nextStep} exit={onExit} />;
      case 2: return <OnboardingPurpose nextStep={nextStep} prevStep={prevStep} />;
      case 3: return <OnboardingStructure nextStep={nextStep} prevStep={prevStep} />;
      case 4: return <OnboardingTools nextStep={nextStep} prevStep={prevStep} />;
      case 5: return <OnboardingReview onComplete={onComplete} prevStep={prevStep} goToStep={goToStep} />;
      default: return <OnboardingCreateGroup nextStep={nextStep} exit={onExit} />;
    }
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      <div className="w-full max-w-2xl mx-auto bg-transparent">
        {renderStep()}
      </div>
    </OnboardingContext.Provider>
  );
};

export default OnboardingView;