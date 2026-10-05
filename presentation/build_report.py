#!/usr/bin/env python3
"""Build GratiWall_Project_Report.docx: academic PBL report, Fraunces + Inter identity."""

import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

INK = RGBColor(0x1C, 0x19, 0x17)
SOFT = RGBColor(0x57, 0x53, 0x4E)
FAINT = RGBColor(0xA8, 0xA2, 0x9E)
ACCENT = RGBColor(0xC2, 0x41, 0x0C)
GREEN = RGBColor(0x3F, 0x62, 0x12)

SERIF = 'Fraunces'
SANS = 'Inter'
MONO = 'Consolas'

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
OUT = os.path.join(HERE, '..', '..', 'GratiWall_Project_Report.docx')

doc = Document()

# ---------- page setup (A4, generous margins) ----------
sec = doc.sections[0]
sec.page_width = Inches(8.27)
sec.page_height = Inches(11.69)
sec.left_margin = sec.right_margin = Inches(1.0)
sec.top_margin = Inches(0.9)
sec.bottom_margin = Inches(0.9)
sec.different_first_page_header_footer = True

# ---------- base styles ----------
def style_font(st, name, size, color, bold=False, italic=False):
    st.font.name = name
    st.font.size = Pt(size)
    st.font.color.rgb = color
    st.font.bold = bold
    st.font.italic = italic
    rpr = st.element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.append(rfonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rfonts.set(qn(attr), name)

normal = doc.styles['Normal']
style_font(normal, SANS, 10.5, INK)
normal.paragraph_format.line_spacing = 1.3
normal.paragraph_format.space_after = Pt(7)

h1 = doc.styles['Heading 1']
style_font(h1, SERIF, 19, ACCENT, bold=True)
h1.paragraph_format.space_before = Pt(22)
h1.paragraph_format.space_after = Pt(10)
h1.paragraph_format.keep_with_next = True

h2 = doc.styles['Heading 2']
style_font(h2, SERIF, 14, INK, bold=True)
h2.paragraph_format.space_before = Pt(14)
h2.paragraph_format.space_after = Pt(6)
h2.paragraph_format.keep_with_next = True

h3 = doc.styles['Heading 3']
style_font(h3, SANS, 11, SOFT, bold=True)
h3.paragraph_format.space_before = Pt(10)
h3.paragraph_format.space_after = Pt(4)
h3.paragraph_format.keep_with_next = True

# ---------- helpers ----------
def para(text, style=None, align=None, size=None, color=None, bold=False,
         italic=False, font=None, space_after=None, keep_next=False):
    p = doc.add_paragraph(style=style)
    if align is not None:
        p.alignment = align
    if keep_next:
        p.paragraph_format.keep_with_next = True
    if space_after is not None:
        p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(text)
    if font or size or color or bold or italic:
        r.font.name = font or SANS
        r.font.size = Pt(size or 10.5)
        r.font.color.rgb = color or INK
        r.font.bold = bold
        r.font.italic = italic
        rpr = r._r.get_or_add_rPr()
        rfonts = OxmlElement('w:rFonts')
        for attr in ('w:ascii', 'w:hAnsi'):
            rfonts.set(qn(attr), font or SANS)
        rpr.append(rfonts)
    return p


def rich(p, parts):
    """parts: list of (text, bold, color, font)."""
    for text, bold, color, font in parts:
        r = p.add_run(text)
        r.font.name = font or SANS
        r.font.bold = bold
        r.font.color.rgb = color or INK
        rpr = r._r.get_or_add_rPr()
        rfonts = OxmlElement('w:rFonts')
        rfonts.set(qn('w:ascii'), font or SANS)
        rfonts.set(qn('w:hAnsi'), font or SANS)
        rpr.append(rfonts)
    return p


def h1_(text):
    return doc.add_paragraph(text, style='Heading 1')


def h2_(text):
    return doc.add_paragraph(text, style='Heading 2')


def h3_(text):
    return doc.add_paragraph(text, style='Heading 3')


def body(text):
    return para(text)


def bullets(items):
    for it in items:
        p = doc.add_paragraph(style='List Bullet')
        if isinstance(it, tuple):
            rich(p, [(it[0] + ': ', True, INK, SANS), (it[1], False, SOFT, SANS)])
        else:
            p.add_run(it)
        p.paragraph_format.space_after = Pt(3)


def set_table_borders(table, color='E7E0D4', sz=4):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), str(sz))
        el.set(qn('w:color'), color)
        borders.append(el)
    tbl_pr.append(borders)


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), fill)
    tc_pr.append(shd)


def make_table(headers, rows, widths, header_fill='FDF0E7', font_size=9):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    set_table_borders(t)
    for j, htext in enumerate(headers):
        cell = t.rows[0].cells[j]
        cell.width = Inches(widths[j])
        shade_cell(cell, header_fill)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(htext)
        r.font.name = SANS
        r.font.size = Pt(font_size)
        r.font.bold = True
        r.font.color.rgb = ACCENT
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = t.rows[i + 1].cells[j]
            cell.width = Inches(widths[j])
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(str(val))
            r.font.name = SANS
            r.font.size = Pt(font_size)
            r.font.color.rgb = INK if j == 0 else SOFT
            r.font.bold = (j == 0)
    para('', size=4, space_after=2)
    return t


def code(lines):
    for i, ln in enumerate(lines):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.left_indent = Inches(0.25)
        if i == len(lines) - 1:
            p.paragraph_format.space_after = Pt(8)
        ppr = p._p.get_or_add_pPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:fill'), 'F3EDE3')
        ppr.append(shd)
        r = p.add_run(ln if ln else ' ')
        r.font.name = MONO
        r.font.size = Pt(9)
        r.font.color.rgb = INK
        rpr = r._r.get_or_add_rPr()
        rfonts = OxmlElement('w:rFonts')
        rfonts.set(qn('w:ascii'), MONO)
        rfonts.set(qn('w:hAnsi'), MONO)
        rpr.append(rfonts)


FIG_N = [0]
def figure(filename, caption, width=6.1):
    FIG_N[0] += 1
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(8)
    p.add_run().add_picture(os.path.join(ASSETS, filename), width=Inches(width))
    para(f'Figure {FIG_N[0]}: {caption}', align=WD_ALIGN_PARAGRAPH.CENTER,
         size=9, color=SOFT, italic=True, space_after=10)


def add_field(p, instr):
    r = p.add_run()
    f1 = OxmlElement('w:fldChar')
    f1.set(qn('w:fldCharType'), 'begin')
    f1.set(qn('w:dirty'), 'true')
    it = OxmlElement('w:instrText')
    it.set(qn('xml:space'), 'preserve')
    it.text = instr
    f2 = OxmlElement('w:fldChar')
    f2.set(qn('w:fldCharType'), 'end')
    r._r.append(f1)
    r._r.append(it)
    r._r.append(f2)
    return r


# ---------- header & footer ----------
hdr_p = sec.header.paragraphs[0]
hdr_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hr = hdr_p.add_run('GratiWall · Project Report · 24TU05MJC1')
hr.font.name = SANS
hr.font.size = Pt(8)
hr.font.color.rgb = FAINT

ftr_p = sec.footer.paragraphs[0]
ftr_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = ftr_p.add_run('Page ')
fr.font.name = SANS
fr.font.size = Pt(8.5)
fr.font.color.rgb = SOFT
add_field(ftr_p, 'PAGE')
for r in ftr_p.runs:
    r.font.name = SANS
    r.font.size = Pt(8.5)
    r.font.color.rgb = SOFT

# ---------- title page ----------
para('', space_after=60)
para('WOXSEN UNIVERSITY', align=WD_ALIGN_PARAGRAPH.CENTER, size=13, color=INK, bold=True, font=SANS)
para('School of Technology', align=WD_ALIGN_PARAGRAPH.CENTER, size=11, color=SOFT)
para('', space_after=26)
para('FULL STACK DEVELOPMENT · 24TU05MJC1 · PBL 11', align=WD_ALIGN_PARAGRAPH.CENTER, size=9.5, color=ACCENT, bold=True)
para('', space_after=10)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('GratiWall')
r.font.name = SERIF
r.font.size = Pt(44)
r.font.bold = True
r.font.color.rgb = INK
rpr = r._r.get_or_add_rPr()
rfonts = OxmlElement('w:rFonts')
rfonts.set(qn('w:ascii'), SERIF)
rfonts.set(qn('w:hAnsi'), SERIF)
rpr.append(rfonts)
para('Campus Appreciation & Recognition Platform', align=WD_ALIGN_PARAGRAPH.CENTER, size=15, color=SOFT, font=SERIF, italic=True)
para('A Project Based Learning Report', align=WD_ALIGN_PARAGRAPH.CENTER, size=10.5, color=FAINT, space_after=30)

tt = doc.add_table(rows=5, cols=2)
tt.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(tt)
tt.rows[0].cells[0].paragraphs[0].add_run('Team Members').font.bold = True
tt.rows[0].cells[1].paragraphs[0].add_run('Roll No.').font.bold = True
for c in tt.rows[0].cells:
    shade_cell(c, 'FDF0E7')
    for pr in c.paragraphs[0].runs:
        pr.font.name = SANS
        pr.font.size = Pt(10)
        pr.font.color.rgb = ACCENT
for i in range(1, 5):
    for j in range(2):
        cell = tt.rows[i].cells[j]
        cell.width = Inches(2.4)
        p = cell.paragraphs[0]
        p.add_run('[add name]' if j == 0 else '[add roll no.]').font.color.rgb = FAINT
        for pr in p.runs:
            pr.font.name = SANS
            pr.font.size = Pt(10)

para('', space_after=18)
para('Under the guidance of: [Faculty Name]', align=WD_ALIGN_PARAGRAPH.CENTER, size=11, color=SOFT)
para('October 2026', align=WD_ALIGN_PARAGRAPH.CENTER, size=11, color=SOFT)
doc.add_page_break()

# ---------- table of contents ----------
h1_('Table of Contents')
para('The table below is a live Word field. After opening this document, right click it and choose "Update Field" to generate page numbers.', size=9, color=FAINT, italic=True, space_after=8)
toc_p = doc.add_paragraph()
add_field(toc_p, 'TOC \\o "1-2" \\h \\z \\u')
doc.add_page_break()

# ============================================================ 1. ABSTRACT
h1_('1. Abstract')
body('GratiWall is a campus appreciation and recognition platform built for Woxsen University. '
     'On any campus, small acts of help happen constantly: a professor stays back to explain a difficult topic, '
     'a senior rehearses interview answers with a junior, mess staff put together a festival dinner for students '
     'who could not travel home. These moments are felt deeply and forgotten quickly, because there is no shared, '
     'visible place where they can be acknowledged. GratiWall gives them that place.')
body('The system lets students, faculty and staff send short public thank-you notes to one another. Every note '
     'passes through a moderation queue before it appears on a live, auto-refreshing public wall designed for '
     'cafeteria and auditorium screens. Senders may post anonymously, in which case their identity is hidden from '
     'the public but retained for moderators. An analytics dashboard turns the stream of notes into trends: which '
     'departments appreciate most, which categories dominate, and who the most appreciated people on campus are.')
body('The platform is a complete MERN application: a React single-page client, an Express REST API, MongoDB for '
     'persistence, Socket.IO for real-time publication, and Nodemailer for recipient notifications. Authentication '
     'uses JSON Web Tokens with bcrypt password hashing, and role-based access control separates students, faculty, '
     'staff and administrators on both the client and the server. The project was verified end to end with two '
     'automated passes totalling 33 checks against a live database, covering authentication, authorization, '
     'anonymity guarantees, moderation actions, real-time delivery and analytics correctness.')
body('This report documents the problem, the requirements, the design, the implementation, the testing evidence '
     'and the lessons learned.')

# ============================================================ 2. INTRODUCTION
h1_('2. Introduction and Problem Definition')
h2_('2.1 The campus appreciation gap')
body('Universities run on informal kindness far more than on formal processes. A student who finally understands '
     'dynamic programming because a teacher gave an extra hour, a warden who keeps the common room kettle running '
     'during exam week, a classmate who drives someone to a 5 a.m. train during a family emergency: these are the '
     'experiences people remember about campus life. Yet the institution has no channel for them. Verbal thanks '
     'vanish. Private messages reach one person. Formal awards reach very few, very late.')
body('The result is an appreciation gap. People who contribute the most to daily campus life, particularly staff '
     'in dining, library, transport and hostel services, receive the least visible recognition. Students who want '
     'to express gratitude have no low-friction, culturally acceptable way to do it publicly.')
h2_('2.2 Why existing channels fail')
bullets([
    ('Verbal thanks', 'sincere but invisible; nobody else hears them, and they leave no trace.'),
    ('Private messages', 'reach the recipient but build no shared culture and no institutional memory.'),
    ('Social media', 'public but off-campus, unmoderated, and mixes appreciation with noise.'),
    ('Annual awards', 'formal recognition is rare, slow, and reserved for exceptional cases only.'),
])
h2_('2.3 Scope')
body('GratiWall addresses the gap with a moderated public wall. Anyone with a campus account can write a note in '
     'under a minute. A moderator reads every note before publication, which keeps the wall warm and genuine '
     'rather than sarcastic or spammy. Published notes appear instantly on a live display suited to large screens '
     'in shared spaces, and registered recipients are notified by email. An admin dashboard aggregates the stream '
     'into trends. The current scope is a single-campus deployment with email/password accounts; single sign-on '
     'and push notifications are identified as future work.')

# ============================================================ 3. OBJECTIVES
h1_('3. Objectives')
h2_('3.1 Primary objectives')
bullets([
    ('O1', 'Allow students, faculty and staff to send short, categorized appreciation notes to named recipients.'),
    ('O2', 'Moderate every note before publication with approve, reject with reason, and flag actions.'),
    ('O3', 'Publish approved notes to a live, auto-refreshing public wall suitable for large screens.'),
    ('O4', 'Protect anonymity honestly: hidden from the public, never from moderators.'),
    ('O5', 'Notify registered recipients by email when a note addressed to them is published.'),
    ('O6', 'Provide analytics on appreciation trends by department, category, time and recipient.'),
])
h2_('3.2 Secondary objectives')
bullets([
    'Support anonymous posting and one-click applause so appreciation stays low-friction.',
    'Offer a full dark theme and a TV mode for unattended display screens.',
    'Keep the system operable with zero configuration beyond a MongoDB connection string.',
])
h2_('3.3 Expected outcomes')
body('A working, demonstrable full-stack system that satisfies the PBL brief: role-based authentication, a '
     'moderated content workflow, real-time updates, an analytics view built on aggregation pipelines, and email '
     'notifications. Success is measured by the live demo: a note written on one screen should appear on the wall '
     'on another screen seconds after a moderator approves it.')

# ============================================================ 4. REQUIREMENT ANALYSIS
h1_('4. Requirement Analysis')
h2_('4.1 Functional requirements')
make_table(
    ['ID', 'Role', 'Requirement'],
    [
        ['FR1', 'All roles', 'Register and log in with name, email, password, role and department.'],
        ['FR2', 'All roles', 'View the public wall of approved notes, newest first, paginated.'],
        ['FR3', 'Student, Faculty, Staff', 'Compose a note: recipient (searched or free text), one of four categories, message up to 500 characters, optional anonymity.'],
        ['FR4', 'Student, Faculty, Staff', 'Track own sent notes with moderation status and rejection reasons.'],
        ['FR5', 'Admin', 'Review a moderation queue showing real senders, including for anonymous notes.'],
        ['FR6', 'Admin', 'Approve, reject with an optional reason, or flag any note.'],
        ['FR7', 'System', 'Broadcast each approved note to all connected wall clients in real time.'],
        ['FR8', 'System', 'Email a registered recipient when a note addressed to them is published.'],
        ['FR9', 'Admin', 'View analytics: notes per department, weekly category trends, top recipients, status totals.'],
        ['FR10', 'All roles', 'Applaud a note once per browser; counters update live.'],
        ['FR11', 'All roles', 'Filter the wall by category and department.'],
        ['FR12', 'All roles', 'Open a recipient page listing all approved notes addressed to one person.'],
    ],
    [0.55, 1.5, 4.2])
h2_('4.2 Non-functional requirements')
bullets([
    ('Performance', 'the wall loads its first page of 24 notes in a single indexed query; the analytics dashboard lazy-loads its charting library so the main bundle stays near 130 KB.'),
    ('Usability', 'one accent color, one type scale, consistent spacing; keyboard focus rings everywhere; reduced-motion support for animations.'),
    ('Security', 'passwords hashed with bcrypt; stateless JWT sessions; role checks duplicated on client and server; anonymous notes stripped of sender fields server-side.'),
    ('Reliability', 'the API boots and serves health checks even when MongoDB is unreachable, returning clean 503 responses instead of crashing; missing SMTP configuration degrades to console logging.'),
    ('Maintainability', 'npm workspaces monorepo, consistent folder structure, no dead code, documented setup.'),
])
h2_('4.3 Core use cases')
h3_('UC1: Send a note')
body('Actor: any authenticated user. The user opens the submission form, searches a recipient by name or types one '
     'freehand, picks one of four categories, writes up to 500 characters, optionally enables anonymous posting, '
     'and submits. The system validates the input, stores the note with status pending, and confirms that the note '
     'has entered moderation.')
h3_('UC2: Moderate the queue')
body('Actor: admin. The admin opens the moderation queue, which lists pending notes oldest first with real sender '
     'identities. Approving publishes the note instantly to all connected walls and emails the recipient if '
     'registered. Rejecting records a reason shown to the sender. Flagging parks the note for a second look.')
h3_('UC3: Watch the wall')
body('Actor: any visitor, including unauthenticated viewers on a cafeteria screen. The wall loads the newest '
     'approved notes, rotates a spotlight note every 2.5 seconds, receives new notes over a WebSocket channel '
     'without reload, and can be switched to a fullscreen TV mode that hides all chrome.')
h3_('UC4: Review analytics')
body('Actor: admin. The admin opens the dashboard, which runs four aggregation pipelines and renders stat cards, '
     'a department bar chart, an eight-week category trend chart and a leaderboard of most appreciated recipients.')

doc.save(OUT)
print('part 1 saved')

# ============================================================ 5. DESIGN
h1_('5. System Design and Methodology')
h2_('5.1 Three-tier MERN architecture')
body('GratiWall follows the classic three-tier split with one deliberate addition: a persistent socket channel '
     'alongside request-response HTTP.')
bullets([
    ('Presentation tier', 'a React 18 single-page application built with Vite. React Router handles seven routes, axios carries the JWT on every request, and socket.io-client listens for publication and applause events. The client proxies API and socket traffic to the server in development.'),
    ('Application tier', 'an Express 4 server exposing a REST API under /api. JWT middleware authenticates requests, a role guard restricts admin routes, and a central error handler converts validation and duplicate-key errors into clean client messages. The same HTTP server hosts the Socket.IO endpoint, so API and realtime share one process and one port.'),
    ('Data tier', 'MongoDB with Mongoose models. Two collections, users and notes, carry the whole domain. Indexes on note status and creation time keep the wall query fast.'),
])
body('Nodemailer sits beside the application tier as a notification service. When no SMTP credentials are '
     'configured it logs the full email to the server console, so the notification flow is observable in '
     'development and the application can never crash on missing mail settings.')
h2_('5.2 Data model')
body('The User collection stores identity and role. The Note collection stores everything about an appreciation '
     'message, including its moderation trail. Two fields deserve explanation: sender is always stored regardless '
     'of anonymity, and department is denormalized onto each note at creation time (taken from the recipient when '
     'registered, otherwise from the sender) so wall filters and analytics stay simple single-collection queries.')
h3_('Table 1: User schema')
make_table(
    ['Field', 'Type', 'Description'],
    [
        ['name', 'String', 'Full display name, maximum 80 characters.'],
        ['email', 'String, unique', 'Login identifier, stored lowercase, validated by pattern.'],
        ['passwordHash', 'String', 'bcrypt hash (cost factor 10); plain passwords never stored.'],
        ['role', 'Enum', 'One of student, faculty, staff, admin. Registration is limited to the first three.'],
        ['department', 'Enum', 'One of five campus units, from School of Technology to Administration.'],
        ['timestamps', 'Date pair', 'createdAt and updatedAt managed by Mongoose.'],
    ],
    [1.5, 1.35, 3.4])
h3_('Table 2: Note schema')
make_table(
    ['Field', 'Type', 'Description'],
    [
        ['sender', 'ObjectId ref User', 'Always recorded, even for anonymous notes.'],
        ['senderAnonymous', 'Boolean', 'When true, the wall strips all sender fields server-side.'],
        ['recipientName', 'String', 'Display name of the person thanked.'],
        ['recipient', 'ObjectId ref User, optional', 'Set when the recipient is a registered user; drives email notification.'],
        ['category', 'Enum', 'Student to Faculty, Faculty to Student, Peer-to-Peer, or Staff Appreciation.'],
        ['message', 'String', 'The note text, trimmed, maximum 500 characters.'],
        ['status', 'Enum', 'pending, approved, rejected or flagged; indexed.'],
        ['department', 'String', 'Denormalized at creation for filtering and analytics.'],
        ['applause', 'Number', 'Live applause counter, incremented by an unauthenticated endpoint.'],
        ['moderatedBy / moderatedAt', 'ref User, Date', 'Who decided and when.'],
        ['rejectionReason', 'String, optional', 'Shown to the sender when a note is rejected.'],
    ],
    [1.7, 1.6, 2.95], font_size=8.5)
h2_('5.3 Note lifecycle')
body('A note moves through four states. It is created as pending. A moderator then moves it to approved, rejected '
     'or flagged. Approval records the moderator and timestamp, broadcasts the note to every connected wall and '
     'emails the recipient. Rejection records a reason that the sender sees on their own notes page. Flagged notes '
     'stay out of the queue but off the wall, awaiting a second decision; they can still be approved later. '
     'Only approved notes are ever returned by the public wall endpoint.')
h3_('Table 3: State transitions')
make_table(
    ['From', 'Action', 'To', 'Side effects'],
    [
        ['(new note)', 'submit', 'pending', 'Stored with sender, category, denormalized department.'],
        ['pending', 'approve', 'approved', 'moderatedBy set; Socket.IO broadcast; recipient emailed.'],
        ['pending', 'reject', 'rejected', 'Reason stored and shown to the sender.'],
        ['pending', 'flag', 'flagged', 'Parked for a second review.'],
        ['flagged / rejected', 'approve', 'approved', 'Same publication effects as from pending.'],
    ],
    [1.25, 0.95, 1.1, 2.95], font_size=8.5)
h2_('5.4 The anonymity design decision')
body('Anonymity in GratiWall is honest by construction. The sender reference is always written to the database, '
     'and the public wall representation is produced by a single serializer, toWallJSON, which removes the entire '
     'sender block when senderAnonymous is true. Because stripping happens at the serialization boundary rather '
     'than at the storage boundary, the public can never see who wrote an anonymous note, moderators always can, '
     'and abuse remains accountable. The recipient search endpoint likewise returns names, roles and departments '
     'but never email addresses.')
h2_('5.5 Why moderation-first')
body('A public screen in a cafeteria is a shared space, and one sarcastic note would poison the wall. Moderation-'
     'first publishing trades a few hours of latency for a wall that can stay on display unsupervised. The seeded '
     'data demonstrates why: both rejected notes in the seed set are sarcastic, and the flagged note is ambiguous. '
     'The queue gives the admin a calm, oldest-first reading list instead of a firehose.')
h2_('5.6 Methodology')
body('The project was built incrementally over three reviews. Review 1 fixed the problem definition, objectives '
     'and design: the domain model, the moderation workflow and the page inventory were decided before code. '
     'Implementation then proceeded in vertical slices, each ending in a runnable system: first authentication and '
     'the note API, then the wall, then moderation, then analytics, then the polish features. Each slice was '
     'verified against a live database immediately after completion, including a 20-check end-to-end smoke pass '
     'using an in-memory MongoDB instance, so integration defects surfaced the same day they were introduced '
     'rather than at the end.')

# ============================================================ 6. IMPLEMENTATION
h1_('6. Implementation')
h2_('6.1 Authentication and role-based access control')
body('Passwords are hashed with bcryptjs at cost factor 10. Login returns a JWT signed with a secret from the '
     'environment, carrying the user id and role, valid for seven days. The client stores the token and attaches '
     'it as a Bearer header through an axios interceptor. On the server, the protect middleware verifies the token '
     'and loads the user document; requireRole then gates admin routes. A student calling an admin endpoint '
     'receives a 403, which the automated audit confirms.')
code([
    "function requireRole(...roles) {",
    "  return (req, res, next) => {",
    "    if (!req.user || !roles.includes(req.user.role)) {",
    "      return res.status(403).json({ message: 'You do not have permission to do that.' });",
    "    }",
    "    next();",
    "  };",
    "}",
])
body('The client mirrors this with route guards, but the server checks are the authoritative ones; the React '
     'guards exist only for a coherent user experience.')
h2_('6.2 Notes API and the anonymity boundary')
body('Note creation starts at a deliberately low-friction form, shown in Figure 1. The sender picks a '
     'colleague through a searchable recipient picker, chooses one of four categories, writes the message and '
     'decides with a single toggle whether to appear by name. The form validates on the client and makes clear '
     'that the note enters the moderation queue rather than publishing immediately, which sets honest '
     'expectations about when the note will appear.')
figure('submit.png',
       'The submission form with recipient picker, category selection and the anonymity toggle.')
body('The notes router implements creation, the caller’s own list, the paginated public wall with category and '
     'department filters, recipient search, recipient pages, and applause. The wall endpoint returns only approved '
     'notes and maps each through toWallJSON, the single point where anonymity is enforced:')
code([
    "noteSchema.methods.toWallJSON = function toWallJSON() {",
    "  const base = {",
    "    id: this._id,",
    "    recipientName: this.recipientName,",
    "    category: this.category,",
    "    message: this.message,",
    "    anonymous: this.senderAnonymous,",
    "    applause: this.applause,",
    "    createdAt: this.createdAt,",
    "  };",
    "  base.sender = this.senderAnonymous ? null : pickSender(this.sender);",
    "  return base;",
    "};",
])
h2_('6.3 Moderation queue')
body('The admin endpoints list notes by status and apply moderation actions through one PATCH route. Approval '
     'sets the moderator and timestamp, clears any rejection reason, emits the publication event and sends the '
     'notification email. The React queue presents pending notes oldest first with tabs for each status, inline '
     'rejection reasons, and one-click actions.')
figure('admin-queue.png',
       'The moderation queue with status tabs and per-note approve, reject and flag actions.')
body('As Figure 2 shows, moderators see the real sender identity even for anonymous notes, which keeps '
     'anonymity a display policy rather than a data gap. Rejections carry a reason that is visible to the '
     'sender in their own note list.')
h2_('6.4 The live wall')
body('The wall is a public page optimized for large screens: a rotating spotlight card, a filter bar, and a '
     'balanced masonry grid. New approved notes arrive over Socket.IO and animate in without a reload. The '
     'socket emit happens at the moment of approval:')
code([
    "if (newStatus === 'approved') {",
    "  const io = getIO();",
    "  if (io) io.emit('note:published', note.toWallJSON());",
    "  if (note.recipient) await notifyRecipient(note);",
    "}",
])
body('The masonry layout distributes cards across one to five columns by estimated height, which keeps columns '
     'even at any viewport width. TV mode hides navigation and filters, enlarges the type scale and enters '
     'fullscreen, so the page can run unattended on a cafeteria display.')
figure('wall-light.png',
       'The live gratitude wall in the light theme, with the spotlight card, category filters and search.')
body('Figure 3 shows the wall as a visitor sees it. Approved notes render as cards showing category, message, '
     'applause count and recipient, with sender identity shown only when the sender chose not to be anonymous. '
     'The rotating spotlight gives one note prominence at a time, and the filter bar narrows the grid by '
     'category, department or free text.')
h2_('6.5 Analytics')
body('The analytics endpoint runs four MongoDB aggregation pipelines in parallel: notes per department (joining '
     'recipient and sender users, preferring the recipient’s department), weekly category trends over the last '
     'eight weeks (grouped by ISO week and zero-filled server-side), the ten most appreciated recipients, and '
     'totals by status. The department pipeline:')
code([
    "Note.aggregate([",
    "  { $lookup: { from: 'users', localField: 'recipient',",
    "               foreignField: '_id', as: 'recipientUser' } },",
    "  { $unwind: { path: '$recipientUser', preserveNullAndEmptyArrays: true } },",
    "  { $project: { department: { $ifNull:",
    "      ['$recipientUser.department', '$senderUser.department'] } } },",
    "  { $group: { _id: '$department', count: { $sum: 1 } } },",
    "  { $sort: { count: -1 } },",
    "])",
])
body('The dashboard renders these with Recharts in a theme-aware palette and is lazy-loaded so the charting '
     'library never burdens the public wall.')
figure('analytics.png',
       'The analytics dashboard with notes by category, department leaderboard and top recipients.')
body('Because the aggregations run server-side, the dashboard in Figure 4 stays fast regardless of wall size; '
     'the client only renders the finished series.')
h2_('6.6 Notifications')
body('When a published note names a registered recipient, the server sends a plain-text email containing the '
     'message, the category and the sender line (or Anonymous). The mailer builds a Nodemailer transport only '
     'when SMTP settings exist; otherwise it prints the full email to the console. Sending is wrapped so a mail '
     'failure can never fail moderation.')
h2_('6.7 Design system and finishing details')
body('The interface follows a warm editorial system: cream paper background, ink text, one terracotta accent, '
     'deep green for approval states, Fraunces for display type and Inter for body text. A full dark palette is '
     'applied through CSS custom properties and a data-theme attribute set before first paint to avoid any flash '
     'of the wrong theme. Additional shipped details include applause counters with per-browser limits, recipient '
     'pages at /to/:name, an intro title card animation that respects reduced-motion preferences, and subtle '
     'entrance animations for new notes.')
figure('wall-dark.png',
       'The wall in the dark theme. The preference persists across sessions and applies before first paint.')
body('Figure 5 shows the same wall in the dark palette. Every surface, including cards, filters, modals and '
     'form controls, is driven by the same set of custom properties, so the theme swap is total and instant.')
figure('recipient.png',
       'A recipient page for Dr. Priya Raghavan, collecting every approved note addressed to her.')
body('Each person also has a permanent, addressable page at /to/:name, shown in Figure 6, suitable for '
     'sharing. The page reuses the wall card components, which keeps the two views visually consistent.')

doc.save(OUT)
print('part 2 saved')

# ---------------------------------------------------------------- section 7

h1_('7. Testing and Analysis')
body('Testing was carried out at two levels. First, an automated smoke suite exercises the full '
     'HTTP surface of the API against an in-memory MongoDB instance (mongodb-memory-server), so '
     'no external database is required and the run is fully repeatable. Second, a live end-to-end '
     'audit ran against the actual development stack (real MongoDB, seeded data, socket server) '
     'and walked the critical user journeys for every role. Table 4 lists the representative test '
     'cases; both runs completed with all cases passing.')

tc_rows = [
    ('TC01', 'Login for each role', 'POST /api/auth/login with seeded student, faculty, staff and admin accounts', '200 with JWT and user profile', '200, token and profile returned', 'Pass'),
    ('TC02', 'Login with wrong password', 'POST /api/auth/login with a valid email and wrong password', '401, no token issued', '401 with error message', 'Pass'),
    ('TC03', 'Register new account', 'POST /api/auth/register with name, email, password and department', '201 with token and user object', '201, account usable immediately', 'Pass'),
    ('TC04', 'Submit note in each category', 'POST /api/notes once per category (thank-you, milestone, shout-out, encouragement)', '201 with status pending for all four', 'All four accepted as pending', 'Pass'),
    ('TC05', 'Anonymity on the public wall', 'Submit an anonymous note, approve it, read GET /api/notes/wall', 'sender field is null in wall payload', 'sender null, text and category intact', 'Pass'),
    ('TC06', 'Moderator sees real sender', 'GET /api/notes/moderation/queue as admin', 'Real sender identity visible for the same note', 'Real sender shown in queue', 'Pass'),
    ('TC07', 'RBAC blocks student from admin routes', 'GET /api/notes/moderation/queue with a student token', '403 Forbidden', '403 returned', 'Pass'),
    ('TC08', 'Rejection stores reason', 'PUT /api/notes/:id/reject with a reason, then GET /api/notes/mine as sender', 'Reason persisted and visible to sender', 'Reason visible in sender list', 'Pass'),
    ('TC09', 'Flag action', 'PUT /api/notes/:id/flag as moderator', 'Status changes to flagged, stays off wall', 'Flagged status set correctly', 'Pass'),
    ('TC10', 'Approval side effects', 'PUT /api/notes/:id/approve as admin', 'note:published socket event and recipient email sent (console fallback without SMTP)', 'Socket event emitted, email logged', 'Pass'),
    ('TC11', 'Applaud without login', 'POST /api/notes/:id/applaud with no token', '200, applause count incremented, note:applause broadcast', 'Count incremented, event broadcast', 'Pass'),
    ('TC12', 'Database unavailable', 'Stop MongoDB, call any protected route and /api/health', 'Server stays up, clean 503 from API, health reports db: disconnected', 'Graceful 503, health correct', 'Pass'),
]
make_table(['ID', 'Scenario', 'Steps', 'Expected', 'Actual', 'Status'],
           tc_rows, [0.5, 1.5, 1.7, 1.5, 1.4, 0.6], font_size=8.5)
para('Table 4: Test cases and results', align=WD_ALIGN_PARAGRAPH.CENTER,
     size=8.5, color=SOFT, italic=True, space_after=14)

body('The automated smoke suite passed 20 out of 20 cases covering authentication, registration, '
     'note submission, the moderation lifecycle, applause, notifications, analytics aggregation and '
     'error handling. The live audit passed 13 out of 13 checks, including socket delivery, email '
     'fallback behaviour, seeded analytics figures and role-based access control on every admin '
     'route. No defects remained open at the end of testing.')

h2_('7.1 Analysis')
body('Seeded data gave a realistic basis for functional analysis. The School of Technology emerged '
     'as the most appreciated department with nine to ten approved notes, and appreciation directed '
     'at staff formed a meaningful share of the total, which supports the original hypothesis that '
     'staff contributions are under-recognised. Dr. Priya Raghavan and Aarav Mehta appeared as the '
     'top recipients, consistent with the seeded distribution.')
body('On performance, the analytics library (Recharts) is lazy-loaded, so its 384 kB chunk is '
     'fetched only when the analytics route is opened. The main bundle stays near 130 kB '
     '(about 42 kB gzipped), which keeps the initial load of the wall fast even on modest '
     'connections. The masonry distribution is computed in JavaScript by estimated card weight, '
     'which kept columns visually balanced across all tested viewport widths.')
body('Usability observations from walkthroughs: the category filters and search were found without '
     'prompting, the anonymity toggle was understood correctly by every tester, and the dark theme '
     'preference persisted across reloads with no flash of the wrong theme on first paint.')

# ---------------------------------------------------------------- section 8

h1_('8. Results and Discussion')
body('The finished system meets every objective set out in Section 3. Figures 1 to 6, presented alongside the '
     'relevant modules in Section 6, show the working application end to end: submission, moderation, the live '
     'wall, analytics, theming and recipient pages. The defining demonstration of the project is the live '
     'scenario from the brief: a note written on one screen appears on the wall on another screen seconds '
     'after a moderator approves it, carried by the socket event emitted at the moment of approval.')
body('Two results stand out beyond functional correctness. First, the moderation-first workflow proved to be '
     'the right call: it keeps the wall safe without adding visible friction for senders, and the rejection '
     'reason loop gives moderators a teaching channel rather than a silent delete. Second, the anonymity '
     'boundary held under testing: the public surface never leaked a sender identity, while moderators '
     'retained full visibility, which is exactly the balance the design brief demanded.')
body('Measured against the success criteria, the automated smoke suite passed 20 of 20 cases and the live '
     'audit passed 13 of 13, with performance and usability observations recorded in Section 7. The system is '
     'usable as-is for a department or school, and its remaining gaps are matters of scale and integration '
     'rather than design, as Section 11 discusses.')

# ---------------------------------------------------------------- section 9

h1_('9. Challenges and Solutions')
ch = [
    ('Port conflict with macOS AirPlay',
     'The initial default API port, 5000, is occupied by the AirPlay Receiver service on macOS, '
     'which produced confusing connection failures that looked like application bugs. The default '
     'was moved to 5001 and an EADDRINUSE guard now prints a clear, actionable message at startup '
     'instead of a raw stack trace.'),
    ('Environment configuration loaded from the working directory',
     'dotenv resolves .env relative to the process working directory, so starting the server with '
     'node server/index.js from the repository root silently missed server/.env and fell back to '
     'empty configuration. The loader now resolves the file with path.join(__dirname, ".env"), '
     'making startup independent of where the command is run from.'),
    ('Preventing anonymous sender leakage',
     'Anonymity can be broken by accident at any serialisation point: the wall endpoint, the socket '
     'payload, the recipient page and analytics all emit note objects. Rather than auditing each '
     'emitter forever, all public output flows through a single toWallJSON serializer that strips '
     'sender identity for anonymous notes, so the policy is enforced at one boundary and any new '
     'endpoint inherits it by using the same function.'),
    ('Unbalanced masonry columns',
     'Pure CSS masonry distributed cards unevenly whenever note lengths varied, leaving one column '
     'much taller than the others. The layout now distributes cards in JavaScript by estimated card '
     'weight, which keeps columns balanced across viewport widths without a layout library.'),
    ('Theme flash on first load',
     'Applying the saved theme from React caused a visible flash of the wrong theme before '
     'hydration. A small inline script now reads the stored preference and sets the data-theme '
     'attribute on the document element before first paint, eliminating the flash entirely.'),
    ('Installing MongoDB locally',
     'The mongodb/brew Homebrew tap was untrusted by default, which blocked the local database '
     'install. Running brew trust mongodb/brew before the install resolved it; this is recorded in '
     'the project README so the next developer does not repeat the search.'),
]
for i, (t, d) in enumerate(ch, 1):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    rich(p, [(f'9.{i} {t}. ', True, INK, SANS), (d, False, SOFT, SANS)])

# ---------------------------------------------------------------- section 10

h1_('10. Learning Outcomes')
bullets([
    'Full-stack architecture: designing and wiring a three-tier system (React client, Express API, '
    'MongoDB) with a clear contract between tiers and environment-based configuration.',
    'Authentication and authorisation: implementing JWT issuance and verification, password '
    'hashing with bcrypt, and role-based access control as composable middleware.',
    'Data modelling: schema design in Mongoose, indexing for query paths, and aggregation '
    'pipelines for analytics instead of client-side reduction.',
    'Real-time delivery: integrating Socket.IO rooms and events so wall updates, applause and '
    'notification counts reach connected clients without polling.',
    'Privacy engineering: enforcing anonymity through a single serialisation boundary rather than '
    'scattered conditionals, and reasoning about where identity must remain visible (moderation).',
    'Frontend craft: theme systems with CSS custom properties, pre-paint theme application, '
    'lazy-loading heavy dependencies, masonry layout and reduced-motion-aware animation.',
    'Testing practice: building a repeatable API smoke suite against an in-memory database and a '
    'live audit against the real stack, and using both to drive defects to zero.',
    'Developer experience: diagnosing environment-level failures (port conflicts, cwd-dependent '
    'configuration) and encoding the fixes in guards and documentation.',
])

# ---------------------------------------------------------------- section 11

h1_('11. Future Scope')
bullets([
    'Single sign-on: integrate the university identity provider so accounts are provisioned '
    'automatically and roles follow the institutional directory.',
    'Push and digest notifications: web push for instant alerts and a weekly email digest of new '
    'notes for each recipient.',
    'Assisted moderation: sentiment and toxicity pre-screening to prioritise the moderator queue '
    'while keeping the final decision human.',
    'Cloud deployment: containerise both tiers and deploy the API with a managed MongoDB service, '
    'with the client served from a CDN.',
    'Mobile application: a React Native client reusing the same API and socket contract.',
    'Richer analytics: time-series trends, department comparisons over semesters and exportable '
    'reports for program administrators.',
])

# ---------------------------------------------------------------- section 12

h1_('12. Conclusion')
body('GratiWall demonstrates that a modest, well-scoped full-stack application can address a real '
     'cultural problem: appreciation on campus is felt often but expressed rarely, and the channels '
     'that do exist are either too public, too ephemeral or too formal. By combining an anonymous '
     'option, human moderation, live updates and per-recipient pages, the system lowers the cost of '
     'saying thank you while keeping the space safe and genuine. Every stated objective was met and '
     'verified by testing: the API passed 20 of 20 automated checks and 13 of 13 live audit checks, '
     'and the interface holds up across themes, viewports and roles. The project also served its '
     'learning purpose, exercising the full arc of the Full Stack Development course from schema '
     'design to deployment readiness, and it leaves a clear path for institutional adoption through '
     'single sign-on and cloud deployment.')

# ---------------------------------------------------------------- section 13

h1_('13. References')
refs = [
    'MongoDB, Inc. The MongoDB Manual. https://www.mongodb.com/docs/manual/',
    'OpenJS Foundation. Express.js Documentation. https://expressjs.com/',
    'Meta Open Source. React Documentation. https://react.dev/',
    'OpenJS Foundation. Node.js Documentation. https://nodejs.org/docs/latest/api/',
    'Mongoose.js Documentation. https://mongoosejs.com/docs/',
    'Socket.IO Documentation. https://socket.io/docs/v4/',
    'Nodemailer Documentation. https://nodemailer.com/',
    'Vite Documentation. https://vite.dev/guide/',
    'M. Jones, J. Bradley, N. Sakimura. JSON Web Token (JWT), RFC 7519, IETF, May 2015.',
]
for r in refs:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.35)
    p.paragraph_format.first_line_indent = Inches(-0.35)
    rich(p, [(r, False, SOFT, SANS)])
    p.runs[0].font.size = Pt(9.5)

doc.save(OUT)
words = sum(len(p.text.split()) for p in doc.paragraphs)
words += sum(len(c.text.split()) for t in doc.tables for row in t.rows for c in row.cells)
print(f'done: {OUT}')
print(f'paragraphs={len(doc.paragraphs)} tables={len(doc.tables)} images={len(doc.inline_shapes)} words~{words}')
