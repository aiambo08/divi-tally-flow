import { useState, useCallback, useMemo } from 'react';

export type SplitType = 'equal' | 'percentage' | 'custom';

export interface MemberSplit {
  userId: string;
  name: string;
  shareType: SplitType;
  customPercentage?: number;
  customAmount?: number;
  calculatedAmount: number;
}

export interface SplitCalculation {
  members: MemberSplit[];
  totalAmount: number;
  isValid: boolean;
  errors: string[];
}

export const useSplitCalculator = (totalAmount: number, members: { userId: string; name: string }[]) => {
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [memberSplits, setMemberSplits] = useState<Record<string, { percentage?: number; amount?: number }>>({});

  // Calcular la división actual
  const calculation = useMemo((): SplitCalculation => {
    const result: MemberSplit[] = [];
    const errors: string[] = [];
    let totalCalculated = 0;

    members.forEach(member => {
      const memberSplit = memberSplits[member.userId] || {};
      let calculatedAmount = 0;

      switch (splitType) {
        case 'equal':
          calculatedAmount = totalAmount / members.length;
          break;
        
        case 'percentage':
          const percentage = memberSplit.percentage || 0;
          calculatedAmount = (totalAmount * percentage) / 100;
          break;
        
        case 'custom':
          calculatedAmount = memberSplit.amount || 0;
          break;
      }

      result.push({
        userId: member.userId,
        name: member.name,
        shareType: splitType,
        customPercentage: memberSplit.percentage,
        customAmount: memberSplit.amount,
        calculatedAmount
      });

      totalCalculated += calculatedAmount;
    });

    // Validaciones
    if (splitType === 'percentage') {
      const totalPercentage = result.reduce((sum, member) => sum + (member.customPercentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push(`El total de porcentajes debe ser 100% (actual: ${totalPercentage.toFixed(1)}%)`);
      }
    }

    if (splitType === 'custom') {
      if (Math.abs(totalCalculated - totalAmount) > 0.01) {
        errors.push(`La suma de montos debe ser $${totalAmount.toFixed(2)} (actual: $${totalCalculated.toFixed(2)})`);
      }
    }

    return {
      members: result,
      totalAmount,
      isValid: errors.length === 0,
      errors
    };
  }, [totalAmount, members, splitType, memberSplits]);

  const updateMemberSplit = useCallback((userId: string, updates: { percentage?: number; amount?: number }) => {
    setMemberSplits(prev => ({
      ...prev,
      [userId]: { ...prev[userId], ...updates }
    }));
  }, []);

  const resetToEqual = useCallback(() => {
    setSplitType('equal');
    setMemberSplits({});
  }, []);

  const distributeEqually = useCallback(() => {
    if (splitType === 'percentage') {
      const equalPercentage = 100 / members.length;
      const newSplits: Record<string, { percentage: number }> = {};
      members.forEach(member => {
        newSplits[member.userId] = { percentage: equalPercentage };
      });
      setMemberSplits(newSplits);
    } else if (splitType === 'custom') {
      const equalAmount = totalAmount / members.length;
      const newSplits: Record<string, { amount: number }> = {};
      members.forEach(member => {
        newSplits[member.userId] = { amount: equalAmount };
      });
      setMemberSplits(newSplits);
    }
  }, [splitType, members, totalAmount]);

  return {
    splitType,
    setSplitType,
    calculation,
    updateMemberSplit,
    resetToEqual,
    distributeEqually
  };
};