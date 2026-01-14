import React, { useState, createContext, useContext } from 'react';
import { GroupDraft, User } from '../types';
import OnboardingCreateGroup from './OnboardingCreateGroup';
import OnboardingPurpose from './OnboardingPurpose';
import OnboardingStructure from './OnboardingStructure';
import OnboardingTools from './OnboardingTools';
import OnboardingReview from './OnboardingReview';

interface OnboardingContextType {
  groupDraft: GroupDraft;
  setGroupDraft: React.Dispatch<React.SetStateAction<GroupDraft>>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);
export const useOnboardingState = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingState must be used within an OnboardingProvider');
  }
  return context;
};

const createInitialDraft = (user: User): GroupDraft => ({
  name: '',
  description: '',
  purpose: '',
  categories: [],
  privacy: 'Private',
  members: [
    {
      id: (user as any).id || (user as any)._id || 'current-user',
      name: user.fullName || user.email || 'You',
      role: 'Lead Researcher'
    }
  ],
  tools: [],
  template: undefined,
});


interface OnboardingViewProps {
  onComplete: (groupDraft: GroupDraft) => void;
  onExit: () => void;
  user: User;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onExit, user }) => {
  const [step, setStep] = useState(1);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(() => createInitialDraft(user));

  const contextValue = {
    groupDraft,
    setGroupDraft,
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
