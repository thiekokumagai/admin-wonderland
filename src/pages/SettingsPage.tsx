import { useState } from "react";
import { mockSettings, Settings, BusinessHour } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const handleFilePreview = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "logo") { setLogoPreview(url); setSettings((s) => ({ ...s, logo: url })); }
    else { setBannerPreview(url); setSettings((s) => ({ ...s, banner: url })); }
  };

  const updateHour = (idx: number, field: keyof BusinessHour, value: string | boolean) => {
    setSettings((s) => ({
      ...s,
      horarios: s.horarios.map((h, i) => (i === idx ? { ...h, [field]: value } : h)),
    }));
  };

  const handleSave = () => {
    // Pronto para integração com API
    console.log("Salvar configurações:", settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvar</Button>
      </div>

      {/* Logo & Banner */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Identidade Visual</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-lg object-cover border" />}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" /> Enviar logo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePreview(e, "logo")} />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Banner</Label>
              {bannerPreview && <img src={bannerPreview} alt="Banner" className="h-20 w-full rounded-lg object-cover border" />}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" /> Enviar banner
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePreview(e, "banner")} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Contato & Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>WhatsApp</Label>
              <Input value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={settings.instagram} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={settings.endereco} onChange={(e) => setSettings({ ...settings, endereco: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={settings.ocultarEndereco} onCheckedChange={(v) => setSettings({ ...settings, ocultarEndereco: v })} />
            <Label>Ocultar endereço na loja</Label>
          </div>
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Horário de Funcionamento</h2>
          <div className="space-y-3">
            {settings.horarios.map((h, i) => (
              <div key={h.dia} className="flex items-center gap-3 flex-wrap">
                <Switch checked={h.ativo} onCheckedChange={(v) => updateHour(i, "ativo", v)} />
                <span className="w-20 text-sm font-medium">{h.dia}</span>
                <Input type="time" value={h.abertura} onChange={(e) => updateHour(i, "abertura", e.target.value)} className="w-28" disabled={!h.ativo} />
                <span className="text-muted-foreground text-sm">às</span>
                <Input type="time" value={h.fechamento} onChange={(e) => updateHour(i, "fechamento", e.target.value)} className="w-28" disabled={!h.ativo} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Status da Loja</h2>
          <div className="flex items-center gap-2">
            <Switch checked={settings.lojaAberta} onCheckedChange={(v) => setSettings({ ...settings, lojaAberta: v })} />
            <Label>Loja Aberta</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={settings.lojaSuspensa} onCheckedChange={(v) => setSettings({ ...settings, lojaSuspensa: v })} />
            <Label>Loja Suspensa</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
