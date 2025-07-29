import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, DollarSign, Percent, Users } from 'lucide-react';
import { useSplitCalculator, SplitType } from '@/hooks/useSplitCalculator';

interface Member {
  userId: string;
  name: string;
  email: string;
  photoUrl?: string;
}

interface SplitSelectorProps {
  totalAmount: number;
  members: Member[];
  onSplitChange: (splits: { userId: string; shareType: string; customPercentage?: number; customAmount?: number; calculatedAmount: number }[]) => void;
}

export const SplitSelector: React.FC<SplitSelectorProps> = ({
  totalAmount,
  members,
  onSplitChange
}) => {
  const {
    splitType,
    setSplitType,
    calculation,
    updateMemberSplit,
    resetToEqual,
    distributeEqually
  } = useSplitCalculator(totalAmount, members);

  // Notificar cambios al componente padre
  React.useEffect(() => {
    onSplitChange(calculation.members.map(member => ({
      userId: member.userId,
      shareType: member.shareType,
      customPercentage: member.customPercentage,
      customAmount: member.customAmount,
      calculatedAmount: member.calculatedAmount
    })));
  }, [calculation, onSplitChange]);

  const handleSplitTypeChange = (newType: SplitType) => {
    setSplitType(newType);
    if (newType === 'equal') {
      resetToEqual();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          División del Gasto - ${totalAmount.toFixed(2)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de tipo de división */}
        <Tabs value={splitType} onValueChange={handleSplitTypeChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equal" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Igual
            </TabsTrigger>
            <TabsTrigger value="percentage" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Porcentaje
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equal" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              El gasto se dividirá en partes iguales entre todos los miembros.
            </div>
            {calculation.members.map(member => (
              <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={members.find(m => m.userId === member.userId)?.photoUrl} />
                    <AvatarFallback>
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </div>
                <Badge variant="outline">
                  ${member.calculatedAmount.toFixed(2)}
                </Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="percentage" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Asigna porcentajes personalizados a cada miembro.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={distributeEqually}
              >
                Distribuir Igual
              </Button>
            </div>
            
            {calculation.members.map(member => {
              const memberData = members.find(m => m.userId === member.userId);
              return (
                <div key={member.userId} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={memberData?.photoUrl} />
                      <AvatarFallback>
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={member.customPercentage || ''}
                        onChange={(e) => updateMemberSplit(member.userId, {
                          percentage: parseFloat(e.target.value) || 0
                        })}
                        placeholder="0"
                        className="text-center"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">%</span>
                    <Badge variant="outline" className="w-20 justify-center">
                      ${member.calculatedAmount.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Asigna montos específicos a cada miembro.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={distributeEqually}
              >
                Distribuir Igual
              </Button>
            </div>
            
            {calculation.members.map(member => {
              const memberData = members.find(m => m.userId === member.userId);
              return (
                <div key={member.userId} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={memberData?.photoUrl} />
                      <AvatarFallback>
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={member.customAmount || ''}
                        onChange={(e) => updateMemberSplit(member.userId, {
                          amount: parseFloat(e.target.value) || 0
                        })}
                        placeholder="0.00"
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Errores de validación */}
        {!calculation.isValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {calculation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Resumen */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span>Total asignado:</span>
            <span className="font-medium">
              ${calculation.members.reduce((sum, member) => sum + member.calculatedAmount, 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Total del gasto:</span>
            <span className="font-medium">${totalAmount.toFixed(2)}</span>
          </div>
          {calculation.isValid && (
            <div className="flex justify-center mt-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                ✓ División válida
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};