"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Check } from "lucide-react"
import { ToggleMode } from "@/components/toggle-mode"

export default function DevToolsSuite() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">DevTool Helper Suite</h1>
        <p className="text-muted-foreground">Essential developer utilities in one place</p>
        </div>
        <div><ToggleMode/></div>
      </div>

      <Tabs defaultValue="json" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="csv">CSV → JSON</TabsTrigger>
          <TabsTrigger value="base64">Base64</TabsTrigger>
          <TabsTrigger value="timestamp">Timestamp</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="case">Case</TabsTrigger>
        </TabsList>

        <TabsContent value="json">
          <JSONFormatter copyToClipboard={copyToClipboard} copied={copied} />
        </TabsContent>

        <TabsContent value="csv">
          <CSVToJSON copyToClipboard={copyToClipboard} copied={copied} />
        </TabsContent>

        <TabsContent value="base64">
          <Base64Tool copyToClipboard={copyToClipboard} copied={copied} />
        </TabsContent>

        <TabsContent value="timestamp">
          <TimestampConverter copyToClipboard={copyToClipboard} copied={copied} />
        </TabsContent>

        <TabsContent value="url">
          <URLTool copyToClipboard={copyToClipboard} copied={copied} />
        </TabsContent>

        <TabsContent value="text">
          <TextCounter />
        </TabsContent>

        <TabsContent value="case">
          <CaseConverter copyToClipboard={copyToClipboard} copied={copied} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JSONFormatter({
  copyToClipboard,
  copied,
}: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setError("")
    } catch (e) {
      setError("Invalid JSON format")
      setOutput("")
    }
  }

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setError("")
    } catch (e) {
      setError("Invalid JSON format")
      setOutput("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>JSON Formatter</CardTitle>
        <CardDescription>Format, minify, and validate JSON</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="json-input">Input JSON</Label>
          <Textarea
            id="json-input"
            placeholder="Paste your JSON here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-32"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={formatJSON}>Format</Button>
          <Button onClick={minifyJSON} variant="outline">
            Minify
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Output</Label>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(output, "json")}>
                {copied === "json" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea value={output} readOnly className="min-h-32" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CSVToJSON({
  copyToClipboard,
  copied,
}: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [hasHeaders, setHasHeaders] = useState(true)

  const parseCSV = (csv: string) => {
    const rows: string[][] = []
    let row: string[] = []
    let cell = ""
    let quoted = false

    for (let index = 0; index < csv.length; index += 1) {
      const character = csv[index]
      const nextCharacter = csv[index + 1]
      if (character === '"' && quoted && nextCharacter === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = !quoted
      } else if (character === "," && !quoted) {
        row.push(cell.trim())
        cell = ""
      } else if ((character === "\\n" || character === "\\r") && !quoted) {
        if (character === "\\r" && nextCharacter === "\\n") index += 1
        row.push(cell.trim())
        if (row.some((value) => value.length > 0)) rows.push(row)
        row = []
        cell = ""
      } else {
        cell += character
      }
    }

    if (quoted) throw new Error("Unclosed quote in CSV")
    if (cell.length > 0 || row.length > 0) {
      row.push(cell.trim())
      rows.push(row)
    }
    return rows
  }

  const convert = () => {
    try {
      const rows = parseCSV(input)
      if (!rows.length) throw new Error("CSV is empty")
      const width = rows[0].length
      if (rows.some((row) => row.length !== width)) throw new Error("Rows have different numbers of columns")

      const headers = hasHeaders
        ? rows[0].map((header, index) => header || `column_${index + 1}`)
        : rows[0].map((_, index) => `column_${index + 1}`)
      const dataRows = hasHeaders ? rows.slice(1) : rows
      const result = dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])))
      setOutput(JSON.stringify(result, null, 2))
      setError("")
    } catch (conversionError) {
      setOutput("")
      setError(conversionError instanceof Error ? conversionError.message : "Invalid CSV format")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV to JSON</CardTitle>
        <CardDescription>Convert comma-separated data into a JSON array of objects</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Label htmlFor="csv-input">Input CSV</Label>
          <Textarea
            id="csv-input"
            placeholder={'name,email\\nAda,ada@example.com'}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-40 font-mono text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="csv-headers" checked={hasHeaders} onCheckedChange={(checked) => setHasHeaders(checked === true)} />
          <Label htmlFor="csv-headers">First row contains column names</Label>
        </div>
        <Button onClick={convert}>Convert to JSON</Button>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        {output && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="csv-output">JSON output</Label>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(output, "csv-json")}>
                {copied === "csv-json" ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                {copied === "csv-json" ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea id="csv-output" value={output} readOnly className="min-h-56 font-mono text-sm" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Base64Tool({
  copyToClipboard,
  copied,
}: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const encode = () => {
    try {
      const encoded = btoa(input)
      setOutput(encoded)
    } catch (e) {
      setOutput("Error encoding")
    }
  }

  const decode = () => {
    try {
      const decoded = atob(input)
      setOutput(decoded)
    } catch (e) {
      setOutput("Error decoding - invalid Base64")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base64 Encoder/Decoder</CardTitle>
        <CardDescription>Encode and decode Base64 strings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="base64-input">Input</Label>
          <Textarea
            id="base64-input"
            placeholder="Enter text to encode or Base64 to decode..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-24"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={encode}>Encode</Button>
          <Button onClick={decode} variant="outline">
            Decode
          </Button>
        </div>
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Output</Label>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(output, "base64")}>
                {copied === "base64" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea value={output} readOnly className="min-h-24" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TimestampConverter({
  copyToClipboard,
  copied,
}: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [timestamp, setTimestamp] = useState("")
  const [humanDate, setHumanDate] = useState("")
  const [currentTime] = useState(new Date())

  const convertToHuman = () => {
    try {
      const date = new Date(Number.parseInt(timestamp) * 1000)
      setHumanDate(date.toLocaleString())
    } catch (e) {
      setHumanDate("Invalid timestamp")
    }
  }

  const convertToTimestamp = () => {
    try {
      const date = new Date(humanDate)
      const ts = Math.floor(date.getTime() / 1000)
      setTimestamp(ts.toString())
    } catch (e) {
      setTimestamp("Invalid date")
    }
  }

  const getCurrentTimestamp = () => {
    const ts = Math.floor(Date.now() / 1000)
    setTimestamp(ts.toString())
    setHumanDate(new Date().toLocaleString())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unix Timestamp Converter</CardTitle>
        <CardDescription>Convert between Unix timestamps and human-readable dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timestamp">Unix Timestamp</Label>
            <Input
              id="timestamp"
              placeholder="1640995200"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
            <Button onClick={convertToHuman} className="mt-2 w-full" variant="outline">
              Convert to Date
            </Button>
          </div>
          <div>
            <Label htmlFor="human-date">Human Date</Label>
            <Input
              id="human-date"
              placeholder="2024-01-01 12:00:00"
              value={humanDate}
              onChange={(e) => setHumanDate(e.target.value)}
            />
            <Button onClick={convertToTimestamp} className="mt-2 w-full" variant="outline">
              Convert to Timestamp
            </Button>
          </div>
        </div>
        <Button onClick={getCurrentTimestamp} className="w-full">
          Get Current Timestamp
        </Button>
        <div className="text-sm text-muted-foreground">Current time: {currentTime.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}

function URLTool({
  copyToClipboard,
  copied,
}: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const encode = () => {
    const encoded = encodeURIComponent(input)
    setOutput(encoded)
  }

  const decode = () => {
    try {
      const decoded = decodeURIComponent(input)
      setOutput(decoded)
    } catch (e) {
      setOutput("Error decoding URL")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>URL Encoder/Decoder</CardTitle>
        <CardDescription>Encode and decode URL components</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="url-input">Input</Label>
          <Textarea
            id="url-input"
            placeholder="Enter text to encode or encoded URL to decode..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-24"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={encode}>Encode</Button>
          <Button onClick={decode} variant="outline">
            Decode
          </Button>
        </div>
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Output</Label>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(output, "url")}>
                {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea value={output} readOnly className="min-h-24" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TextCounter() {
  const [text, setText] = useState("")

  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split("\n").length,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text Counter</CardTitle>
        <CardDescription>Count characters, words, lines, and paragraphs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="text-input">Text</Label>
          <Textarea
            id="text-input"
            placeholder="Enter your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-32"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.characters}</div>
            <div className="text-sm text-muted-foreground">Characters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.charactersNoSpaces}</div>
            <div className="text-sm text-muted-foreground">No Spaces</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.words}</div>
            <div className="text-sm text-muted-foreground">Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.lines}</div>
            <div className="text-sm text-muted-foreground">Lines</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.paragraphs}</div>
            <div className="text-sm text-muted-foreground">Paragraphs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CaseConverter({
  copyToClipboard,
  copied,
}: { copyToClipboard: (text: string, id: string) => void; copied: string | null }) {
  const [input, setInput] = useState("")
  const [caseType, setCaseType] = useState("uppercase")

  const convertCase = () => {
    switch (caseType) {
      case "uppercase":
        return input.toUpperCase()
      case "lowercase":
        return input.toLowerCase()
      case "title":
        return input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
      case "camel":
        return input
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
          .replace(/\s+/g, "")
      case "pascal":
        return input.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, "")
      case "snake":
        return input.toLowerCase().replace(/\s+/g, "_")
      case "kebab":
        return input.toLowerCase().replace(/\s+/g, "-")
      default:
        return input
    }
  }

  const output = convertCase()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Converter</CardTitle>
        <CardDescription>Convert text between different case formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="case-input">Input Text</Label>
          <Textarea
            id="case-input"
            placeholder="Enter text to convert..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-24"
          />
        </div>
        <div>
          <Label htmlFor="case-type">Case Type</Label>
          <Select value={caseType} onValueChange={setCaseType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="title">Title Case</SelectItem>
              <SelectItem value="camel">camelCase</SelectItem>
              <SelectItem value="pascal">PascalCase</SelectItem>
              <SelectItem value="snake">snake_case</SelectItem>
              <SelectItem value="kebab">kebab-case</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Output</Label>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(output, "case")}>
                {copied === "case" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea value={output} readOnly className="min-h-24" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
