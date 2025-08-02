import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses';
import { Badge } from '@/components/ui/badge';
import { Icon, availableIcons } from '@/components/ui/icon';

const availableColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b'
];

export const CategoriesManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory, submitting } = usePersonalExpenses();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: availableColors[0],
    icon: availableIcons[0]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: availableColors[0],
      icon: availableIcons[0]
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    let success = false;
    
    if (editingId) {
      success = !!(await updateCategory(editingId, formData));
    } else {
      success = !!(await addCategory(formData));
    }

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (category: any) => {
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
    setEditingId(category.id);
    setIsAdding(false);
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Todos los gastos asociados mantendrán la categoría, pero ya no podrás usarla para nuevos gastos.')) {
      await deleteCategory(categoryId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Transporte, Comida..."
                  required
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-9 gap-2 mt-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Ícono</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {availableIcons.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className="h-10 flex items-center justify-center"
                    >
                      <Icon name={icon} className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {editingId ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mis Categorías</CardTitle>
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes categorías creadas aún
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <Icon name={category.icon as any} className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};