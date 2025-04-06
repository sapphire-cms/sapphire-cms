# RFC: TextForm – A Human-Friendly Structured Text Format for Forms

**Author:** Hosuaby  
**Status:** Draft  
**Date:** 2025-04-06  
**Version:** 0.1.0  
**Format Name:** TextForm  
**File Extension:** `.textform`  
**Encoding:** UTF-8  
**Line Endings:** LF (`\n`) preferred  
**MIME Type:** `text/x-textform`  
**License:** MIT

---

## 📄 Summary

**TextForm** is a simple, human-friendly, plaintext format for editing structured data through text-based interfaces (e.g., CLI, editor). It is designed to feel like filling out a form in a text document while remaining easy to parse into JSON or other structured formats.

---

## ✨ Goals

- Make structured documents easily editable with a text editor
- Be readable and writable without special tools
- Map cleanly to JSON or similar data formats
- Support inline validation hints and guidance
- Be linearly parseable and fault-tolerant

---

## 📦 Format Structure

A `TextForm` document is a sequence of **fields**, optionally annotated with comments, metadata, and rich text content.

### 1. **Comments**

Lines starting with `%` are comments. They are **ignored by parsers**, but shown to help users understand the form.

```text
% This is a comment.
% It can span multiple lines.
```

### 2. **Anchors**

Lines containing exactly `%%` mark the **start of a new field block**.

```text
%%
```

### 3. **Field Metadata (optional)**

Immediately after an anchor, `%` comment lines may describe the field's name, type, and hints.

```text
% * Field Name (type: text)
%   Description of what the field is.
```

### 4. **Field Value**

Following the metadata (and optionally a blank line), the user provides the value.

```text
Title of the document
```

### 5. **Booleans (check)**

Use square brackets to indicate booleans:

- `[ ]` = false
- `[x]` = true
- Anything except whitespaces inside `[ ]` is considered truthy

```text
[x]
```

### 6. **Multi-entry Fields**

Fields that accept multiple entries should be separated with lines containing at least three equals sings (`===`).

```text
Entry One

===

Entry Two

===

Entry Three
```

### 7. **Rich Text Fields**

These accept Markdown as input and can include lists, headings, emphasis, etc.

```text
The **Quartz tier** is for those who believe in the open web.

#### Benefits:
- Badge on the website
- Shoutout on socials
```

## 🛠️ Parsing Rules

- Ignore lines starting with `%` (unless marked as errors — see below)
- Ignore empty lines **immediately after an anchor** or **before the next anchor**
- Parse the first non-comment lines after `%%` as the field value
- Use `===` to split multiple entries within a field

## ⚠️ Inline Validation

Errors can be embedded using a special `% !Error!` syntax:

```text
% !Error! This ID is invalid or already taken.
```

These may be shown to the user but ignored by machines unless validation is needed.

## 📂 File Format & Editing Guidelines

A **TextForm** file is composed of two main parts:

1. **A banner block** — a top-level comment section with information and guidance
2. **A sequence of form fields** — each consisting of metadata, input zone, and formatting

### 1. Banner Block

The file **should begin** with a banner: a series of comment lines (`%`) that describe:

- What this form is for (context or purpose)
- Helpful reminders or tips for the user
- Formatting conventions (how to fill the form properly)

```text
% example.textform
% Sponsor Tier Submission Form
% Fill out the fields below to define a sponsor tier.
% Lines starting with % are comments — you can leave them as they are.
% Boolean values use [x] for true, [ ] for false.
% Use "===" to separate multiple values in multi-entry fields.
```

💡 This block is **ignored by parsers** but **essential for human guidance**.
It should be followed by **one or more empty lines** before the first form field.

### 2. Field Structure

Each field is composed of:

1. An anchor line
2. A field comment block
3. A field input zone
4. A trailing empty line

✅ **Anchor**

Each field begins with a line containing only:

```text
%%
```

This marks the **start of a new form field**.

🧾 **Field Comment Block**

Following the anchor, a block of comment lines describes the field. This block may include:

| Line Type         | Line Type                                                                |
|-------------------|--------------------------------------------------------------------------|
| **Line Type**     | The name of the field and its type. Use `*` to mark mandatory **fields** |
| Field description | Optional: Describes the intent or purpose of the field                   |
| `Example:` line   | Optional: Shows a suggested or valid value                               |
| `Note:` lines     | Optional: Provide additional guidance or edge cases                      |
| `!Error!` lines   | 	Optional: Display validation errors from previous submission           |

📌 All of these lines start with `%` and are intended for humans, not machines.

Example:

```text
%%
% * Tier Name (type: text)
%   A catchy name for the sponsor tier.
%   Example: Quartz Supporter
%   Note: Keep it short and simple.
% !Error! Tier name cannot be empty
```

📥 Field Input Zone

After the field comment block and one empty line, the input zone begins.

- This is where the user writes or edits the field value
- It may contain:
  - A default value
  - A previously submitted value
  - A placeholder
  - An example to overwrite

```text
Quartz Supporter
```

For boolean values:

```text
[x]    % means true
[ ]    % means false
```

For multi-entry fields:

```text
Small Dev Agencies

===

Indie Devs
```

🚨 Important Formatting Rules

- Field input zone must be followed by one empty line
- Empty lines are ignored between fields or following anchors
- Parsers should be resilient to minor formatting quirks but should respect the structure

### 🧠 Best Practices

- Always include helpful Note: or Example: comments to improve user experience
- Pre-fill fields with actual data if available to reduce user effort
- Avoid breaking lines in boolean checkboxes or entry delimiters
- Keep banner comments short and friendly
- Display !Error! lines only after validation attempts

## Complete example

```text
% // file example.textform
% Sponsor Tiers
% Collection of available sponsor tiers
% Creating a new document.
% Note: Lines starting with character "%" are comments. They are here to help you. Do not edit them.
%       For multi-entry fields, use lines containing at least three equals signs "===" to separate entries.

%%
% * Tier ID (type: id)
%   Technical ID of the tier
%   Example: lovely_doc-4238
% !Error! Id cannot start with "_"

_r2d2

%%
% * Tier Name (type: text)
%   A catchy name for the sponsor tier.

Quartz Supporter

%%
% * Is Tier Available (type: check)
%   Note: this is a check field. Put anything between square brackets to check it. Leave it empty is unchecked.

[x]

%%
%   Sponsor Tier Category (type: tag)
%   One of (Cannot choose many): %sponsor %partner %founding partner

 %sponsor

%%
% * Donation Amount (type: number)
%   Required donation amount in USD.

500

%%
%   Preferred Targets (type: text)
%   Note: this is a multi-entries field. Separate you entries with lines containing at least three equals signs "===".

Small Dev Agencies

===

Indie Devs

%%
% * Tier Description (type: rich-text)
%   Note: this is a rich text field. It accepts content written with Markdown.

The **Quartz tier** is open to anyone who wants to contribute their **grain of sand** to the foundation of the next generation of CMS.

Whether you're a **small developer agency or a professional user** who loves Sapphire CMS, your support means the world to us.

Your contribution helps us move faster, build better, and keep the project truly open.

#### You’ll receive:

- Your company’s logo displayed in the Supporters section on our website.
- A thank-you shoutout on our social media channels.
```
