import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export default function ImportDataPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("csv");
  const [csvData, setCsvData] = useState<string>("");
  const [jsonData, setJsonData] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Check if user is admin or coach, if not redirect to home
  if (user && user.role !== "admin" && user.role !== "coach") {
    navigate("/");
    return null;
  }

  // If user is not logged in, we rely on ProtectedRoute to redirect
  
  // Mutation for importing data
  const importMutation = useMutation({
    mutationFn: async (data: { format: string, data: string }) => {
      const res = await apiRequest("POST", "/api/import/players", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data imported successfully",
        description: `${data.imported} players were imported.${data.errors.length > 0 ? ' Some records had errors.' : ''}`,
      });
      
      if (data.errors.length > 0) {
        console.error("Import errors:", data.errors);
      }
      
      // Clear the form
      setCsvData("");
      setJsonData("");
      setFile(null);
      setPreviewData([]);
      setValidationErrors([]);
      
      // Invalidate the players query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (activeTab === "csv") {
          setCsvData(content);
          validateAndPreviewCsv(content);
        } else {
          setJsonData(content);
          validateAndPreviewJson(content);
        }
      };
      
      if (activeTab === "csv") {
        reader.readAsText(selectedFile);
      } else {
        reader.readAsText(selectedFile);
      }
    }
  };

  // Validate and preview CSV data
  const validateAndPreviewCsv = (data: string) => {
    setValidationErrors([]);
    setPreviewData([]);
    
    // Split the CSV data into rows
    const rows = data.split("\\n").filter(row => row.trim() !== "");
    if (rows.length === 0) {
      setValidationErrors(["CSV file is empty"]);
      return;
    }
    
    // Extract headers from the first row
    const headers = rows[0].split(",").map(h => h.trim());
    const requiredHeaders = ["firstName", "lastName", "dateOfBirth", "ageGroup", "parentName", "parentEmail"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      setValidationErrors([`Missing required headers: ${missingHeaders.join(", ")}`]);
      return;
    }
    
    // Parse the data rows
    const parsedData = [];
    const errors = [];
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(",").map(v => v.trim());
      
      // Check if row has correct number of columns
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1} has incorrect number of columns`);
        continue;
      }
      
      // Create a data object for this row
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
      
      // Validate required fields
      const rowErrors = [];
      requiredHeaders.forEach(header => {
        if (!rowData[header]) {
          rowErrors.push(`Missing ${header}`);
        }
      });
      
      // Check date format
      if (rowData.dateOfBirth && !/^\\d{4}-\\d{2}-\\d{2}$/.test(rowData.dateOfBirth)) {
        rowErrors.push("Date of birth must be in YYYY-MM-DD format");
      }
      
      if (rowErrors.length > 0) {
        errors.push(`Row ${i + 1}: ${rowErrors.join(", ")}`);
      }
      
      parsedData.push(rowData);
    }
    
    setValidationErrors(errors);
    setPreviewData(parsedData.slice(0, 5)); // Preview first 5 rows
  };

  // Validate and preview JSON data
  const validateAndPreviewJson = (data: string) => {
    setValidationErrors([]);
    setPreviewData([]);
    
    try {
      const jsonData = JSON.parse(data);
      
      if (!Array.isArray(jsonData)) {
        setValidationErrors(["JSON data must be an array"]);
        return;
      }
      
      if (jsonData.length === 0) {
        setValidationErrors(["JSON array is empty"]);
        return;
      }
      
      const requiredFields = ["firstName", "lastName", "dateOfBirth", "ageGroup", "parentName", "parentEmail"];
      const errors: string[] = [];
      
      jsonData.forEach((item, index) => {
        const missingFields = requiredFields.filter(field => !item[field]);
        
        if (missingFields.length > 0) {
          errors.push(`Item ${index + 1}: Missing required fields: ${missingFields.join(", ")}`);
        }
        
        // Check date format
        if (item.dateOfBirth && !/^\\d{4}-\\d{2}-\\d{2}$/.test(item.dateOfBirth)) {
          errors.push(`Item ${index + 1}: Date of birth must be in YYYY-MM-DD format`);
        }
      });
      
      setValidationErrors(errors);
      setPreviewData(jsonData.slice(0, 5)); // Preview first 5 items
    } catch (error) {
      setValidationErrors(["Invalid JSON format"]);
    }
  };

  // Handle form submission
  const handleImport = () => {
    if (activeTab === "csv") {
      if (!csvData) {
        toast({
          title: "No data to import",
          description: "Please enter CSV data or upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      
      if (validationErrors.length > 0) {
        toast({
          title: "Validation errors",
          description: "Please fix validation errors before importing",
          variant: "destructive",
        });
        return;
      }
      
      importMutation.mutate({ format: "csv", data: csvData });
    } else {
      if (!jsonData) {
        toast({
          title: "No data to import",
          description: "Please enter JSON data or upload a JSON file",
          variant: "destructive",
        });
        return;
      }
      
      if (validationErrors.length > 0) {
        toast({
          title: "Validation errors",
          description: "Please fix validation errors before importing",
          variant: "destructive",
        });
        return;
      }
      
      importMutation.mutate({ format: "json", data: jsonData });
    }
  };

  // Handle manual data validation
  const handleValidate = () => {
    if (activeTab === "csv") {
      validateAndPreviewCsv(csvData);
    } else {
      validateAndPreviewJson(jsonData);
    }
  };

  return (
    <MainLayout title="Import Data">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 heading">Import Player Data</h1>
          <p className="text-gray-600">Import children's data with age and parent information</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Players</CardTitle>
            <CardDescription>
              Import player data in CSV or JSON format. Make sure the data includes the required fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value);
              setValidationErrors([]);
              setPreviewData([]);
            }}>
              <TabsList className="mb-4">
                <TabsTrigger value="csv">CSV Format</TabsTrigger>
                <TabsTrigger value="json">JSON Format</TabsTrigger>
              </TabsList>
              
              <TabsContent value="csv">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-upload" className="block mb-2">Upload CSV File</Label>
                    <Input 
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="mb-4"
                    />
                    <p className="text-sm text-gray-500 mb-2">
                      Or paste CSV data below. First row should contain headers:
                    </p>
                    <p className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded mb-4">
                      firstName,lastName,dateOfBirth,ageGroup,parentName,parentEmail,parentPhone
                    </p>
                    <Textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Paste CSV data here..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="json">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="json-upload" className="block mb-2">Upload JSON File</Label>
                    <Input 
                      id="json-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="mb-4"
                    />
                    <p className="text-sm text-gray-500 mb-2">
                      Or paste JSON data below. Data should be an array of player objects:
                    </p>
                    <p className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded mb-4">
                      [&#123;"firstName": "John", "lastName": "Doe", "dateOfBirth": "2010-05-15", "ageGroup": "Under 14s", "parentName": "Jane Doe", "parentEmail": "jane@example.com", "parentPhone": "1234567890"&#125;]
                    </p>
                    <Textarea
                      value={jsonData}
                      onChange={(e) => setJsonData(e.target.value)}
                      placeholder="Paste JSON data here..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="font-medium text-red-700">Validation Errors</h3>
                </div>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Data Preview */}
            {previewData.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Data Preview (first 5 records)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="px-4 py-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((item, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(item).map((value, i) => (
                            <td key={i} className="px-4 py-2">{value as string}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleValidate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Validate Data
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importMutation.isPending || validationErrors.length > 0}
            >
              {importMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Import Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Import Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Required Fields</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  <li><span className="font-mono">firstName</span> - First name of the player</li>
                  <li><span className="font-mono">lastName</span> - Last name of the player</li>
                  <li><span className="font-mono">dateOfBirth</span> - Date of birth in YYYY-MM-DD format</li>
                  <li><span className="font-mono">ageGroup</span> - Age group (e.g., "Under 12s", "Under 14s", "Under 16s")</li>
                  <li><span className="font-mono">parentName</span> - Full name of parent</li>
                  <li><span className="font-mono">parentEmail</span> - Email address of parent (will be used for account creation)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Optional Fields</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  <li><span className="font-mono">parentPhone</span> - Phone number of parent</li>
                  <li><span className="font-mono">playerType</span> - Player type (e.g., "Batsman", "Bowler", "All-rounder")</li>
                  <li><span className="font-mono">emergencyContact</span> - Emergency contact information</li>
                  <li><span className="font-mono">medicalInformation</span> - Medical information or notes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Import Process</h3>
                <p className="text-sm text-gray-600">
                  During import, the system will:
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 mt-2">
                  <li>Check if parent accounts already exist by email address</li>
                  <li>Create parent accounts if they don't exist</li>
                  <li>Create player profiles linked to their parent accounts</li>
                  <li>Assign players to their appropriate age groups</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}