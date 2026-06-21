'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../../components/ui/card';
import { 
  Loader2, Plus, Trash2, Printer, Download, QrCode, 
  Layers, AlertCircle, Info, ExternalLink 
} from 'lucide-react';

interface Table {
  _id: string;
  tableNumber: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form field state
  const [tableNumber, setTableNumber] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tables');
      setTables(response.data.data);
    } catch (err: any) {
      console.error('Fetch tables error:', err);
      setError('Failed to retrieve restaurant tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!tableNumber) return;

    setFormLoading(true);
    try {
      const response = await api.post('/tables', { tableNumber });
      setTables((prev) => [...prev, response.data.data].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)));
      setTableNumber('');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to generate table QR code.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string, tableNum: string) => {
    if (!window.confirm(`Are you sure you want to delete Table ${tableNum}? This will invalidate its QR code.`)) return;

    try {
      await api.delete(`/tables/${tableId}`);
      setTables((prev) => prev.filter((t) => t._id !== tableId));
    } catch (err: any) {
      alert('Failed to remove table.');
    }
  };

  // Helper to trigger browser print dialog on a clean pop-up window containing just the QR code sticker
  const handlePrintQR = (tableNum: string, qrBase64: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - Table ${tableNum}</title>
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              text-align: center;
              padding: 40px;
              color: #1c1917;
            }
            .sticker-card {
              border: 3px double #d97706;
              border-radius: 20px;
              padding: 30px;
              display: inline-block;
              max-width: 320px;
              background-color: #fafaf9;
            }
            h1 {
              font-size: 26px;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            p {
              font-size: 14px;
              color: #78716c;
              margin-bottom: 25px;
            }
            img {
              width: 250px;
              height: 250px;
            }
            .footer-note {
              font-size: 10px;
              color: #a8a29e;
              margin-top: 20px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div class="sticker-card">
            <h1>Table ${tableNum}</h1>
            <p>Scan to view menu & place your order</p>
            <img src="${qrBase64}" alt="QR code" />
            <div class="footer-note">Powered by CafeFlow</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="font-serif font-black text-2xl tracking-tight">Table QR Management</h2>
        <p className="text-xs text-muted-foreground">Register dining tables, download dynamic QR codes, and print sticker labels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Register Table form (1/3 width) */}
        <Card className="border border-border/60 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-serif font-black flex items-center gap-1.5">
              <QrCode className="w-5 h-5 text-primary" /> Register Dining Table
            </CardTitle>
            <CardDescription className="text-xs">Creates a table database entry and generates its menu QR sticker.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTableSubmit} className="space-y-4 text-sm">
              {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Table Number/Name
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 5 or Table 5"
                  className="w-full text-xs bg-secondary/40 text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>

              <Button type="submit" disabled={formLoading} className="w-full font-bold cursor-pointer">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register & Create QR'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tables list display (2/3 width) */}
        <Card className="lg:col-span-2 border border-border/60 shadow-md min-h-[40vh] flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-serif font-black flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-primary" /> Table Roster
                </CardTitle>
                <CardDescription className="text-xs">Current list of registered tables and QR codes</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                Total: {tables.length}
              </Badge>
            </div>
          </CardHeader>

          {loading ? (
            <div className="flex-1 flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tables.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-2 text-muted-foreground">
              <QrCode className="w-10 h-10 text-muted-foreground/30" />
              <h4 className="font-serif font-bold">No tables registered</h4>
              <p className="text-xs max-w-xs">Use the registration form on the left to initialize table menu codes.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 p-5">
              {tables.map((table) => (
                <div key={table._id} className="bg-secondary/20 border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-between gap-4 shadow-sm group">
                  {/* QR view box */}
                  <div className="relative w-44 h-44 bg-white border border-border/30 rounded-xl overflow-hidden flex items-center justify-center p-2.5">
                    {table.qrCodeUrl ? (
                      <img src={table.qrCodeUrl} alt={`Table ${table.tableNumber} QR`} className="w-full h-full object-contain" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <div className="w-full text-center space-y-3">
                    <div>
                      <h4 className="font-serif font-black text-lg text-foreground">Table {table.tableNumber}</h4>
                      <span className="text-[9px] text-muted-foreground font-semibold">Registered: {new Date(table.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/40 pt-3 justify-center">
                      {table.qrCodeUrl && (
                        <>
                          <a
                            href={table.qrCodeUrl}
                            download={`Table-${table.tableNumber}-QR.png`}
                            className="p-2 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
                            title="Download PNG File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          
                          <button
                            onClick={() => handlePrintQR(table.tableNumber, table.qrCodeUrl || '')}
                            className="p-2 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
                            title="Print Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteTable(table._id, table.tableNumber)}
                        className="p-2 rounded-lg border border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer flex items-center justify-center"
                        title="Delete Table"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-border/30 bg-secondary/10 text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Info className="w-4 h-4 shrink-0" />
            <span>Scanning these QR codes redirects customers instantly to your menu page with automated table identification.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
