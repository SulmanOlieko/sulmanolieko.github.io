% ============================ sulmancv.cls ============================
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{sulmancv}[2025/08/31 v1.1 Sulman CV class]

% ---- Forward unknown options to article (e.g., 10pt, 11pt, letterpaper)
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
\LoadClass{article}

% ================== REQUIRED PACKAGES (portable defaults) ==================
\RequirePackage[T1]{fontenc}
% \RequirePackage{epigrafica} % uncomment ONLY if installed

\RequirePackage{xcolor}
\RequirePackage{graphicx}
\RequirePackage{array}
\RequirePackage{tabularx}
\RequirePackage{etoolbox}
\RequirePackage{calc}
\RequirePackage{bookmark}
\RequirePackage{lastpage}
\RequirePackage{ragged2e}
\RequirePackage{amsmath}
\RequirePackage{enumitem}
\RequirePackage[many]{tcolorbox}
\RequirePackage[explicit]{titlesec}
\RequirePackage{fontawesome5}
\RequirePackage{eso-pic}       % (no pscoord needed with our new placement)
\RequirePackage{forest}
\RequirePackage{tikz}
\RequirePackage{hyperref}
\RequirePackage{ifthen}
\RequirePackage{geometry}

% ================== PAGE GEOMETRY (matches your template) ==================
\geometry{
  ignoreheadfoot,
  top=1.5cm,
  bottom=1.5cm,
  left=1.5cm,
  right=1.5cm,
  footskip=0.8cm
  % ,showframe % <- uncomment for debugging
}

% ================== COLOURS ==================
\definecolor{primaryColor}{RGB}{0,128,128}
\definecolor{cvGutterLine}{HTML}{E5E7EB}
\definecolor{cvSeparator}{HTML}{EEF1F4}
\definecolor{cvMuted}{HTML}{9CA3AF}
\definecolor{primaryColor2}{HTML}{C0C0C0}

% ================== GLOBAL SPACING/TWEAKS ==================
\AtBeginDocument{\pdfgentounicode=1}
\raggedbottom
\setcounter{secnumdepth}{0}
\setlength{\parindent}{0pt}
\setlength{\topskip}{0pt}
\setlength{\parskip}{0.1cm plus4mm minus3mm}
\pagestyle{empty} % body pages have custom footer set below

% ================== SECTION STYLE ==================
\titleformat{\section}{\Large\color{primaryColor}}{}{0pt}{%
  \textbf{#1}\hspace{0.15cm}\titlerule[0.8pt]\hspace{-0.1cm}%
}
\titlespacing{\section}{0pt}{0.3cm}{0.2cm}

% ================== TABULARX HELPERS ==================
\newcolumntype{L}[1]{>{\raggedright\let\newline\\\arraybackslash\hspace{0pt}}p{#1}}
\newcolumntype{R}[1]{>{\raggedleft\let\newline\\\arraybackslash\hspace{0pt}}p{#1}}
\newcolumntype{K}[1]{>{\let\newline\\\arraybackslash\hspace{0pt}}X}
\setlength\tabcolsep{-1.5pt}
% centre every tabularx (as in your template)
\let\sulmancv@origTX\tabularx
\let\sulmancv@origEndTX\endtabularx
\renewenvironment{tabularx}{\bgroup\centering\sulmancv@origTX}{\sulmancv@origEndTX\par\egroup}

% ================== LISTS & "CODE-VIEWER" BOX ==================
% Knobs
\newcommand{\CodeGutterWidth}{1.6cm}
\newcommand{\CodeGutterPad}{0.2em}
\newcommand{\CodeSepThickness}{0.28pt}
\newcommand{\CodeBoxTopBottom}{0.6em}
\newcommand{\CodeBeforeAfterSkip}{0.3\baselineskip}
\newcommand{\CodeItemsepI}{0.10\baselineskip}
\newcommand{\CodeItemsepII}{0.10\baselineskip}
\newcommand{\CodeItemsepIII}{0.10\baselineskip}
\newcommand{\CodeTopsepI}{.35\baselineskip}
\newcommand{\CodeTopsepII}{.25\baselineskip}
\newcommand{\CodeTopsepIII}{.20\baselineskip}
\newcommand{\CodeSeparator}{%
  \par\nointerlineskip
  \hbox to \linewidth{\color{cvSeparator}\rule{\linewidth}{\CodeSepThickness}}
  \par\nointerlineskip
}
\newlist{myenumerate}{enumerate}{3}
\setlist[myenumerate,1]{%
  itemsep=\CodeItemsepI,parsep=0pt,topsep=\CodeTopsepI,partopsep=0pt,leftmargin=*,
  label=\llap{\makebox[\CodeGutterWidth][r]{\textcolor{cvMuted}{\footnotesize\arabic*.}}\hspace{\CodeGutterPad}},
  itemjoin=\CodeSeparator
}
\setlist[myenumerate,2]{%
  itemsep=\CodeItemsepII,parsep=0pt,topsep=\CodeTopsepII,partopsep=0pt,leftmargin=*,
  label=\llap{\makebox[\CodeGutterWidth][r]{\textcolor{cvMuted}{\footnotesize\alph*.}}\hspace{\CodeGutterPad}},
  itemjoin=\CodeSeparator
}
\setlist[myenumerate,3]{%
  itemsep=\CodeItemsepIII,parsep=0pt,topsep=\CodeTopsepIII,partopsep=0pt,leftmargin=*,
  label=\llap{\makebox[\CodeGutterWidth][r]{\textcolor{cvMuted}{\footnotesize\roman*.}}\hspace{\CodeGutterPad}},
  itemjoin=\CodeSeparator
}
\tcolorboxenvironment{myenumerate}{%
  enhanced,
  before skip=\CodeBeforeAfterSkip,
  after skip=\CodeBeforeAfterSkip,
  colback=white,colframe=white,boxrule=0pt,arc=1pt,
  left=\dimexpr \CodeGutterWidth+\CodeGutterPad\relax,
  right=0em,top=\CodeBoxTopBottom,bottom=\CodeBoxTopBottom,
  borderline west={0.9pt}{0pt}{cvGutterLine},
  overlay={\draw[cvGutterLine] ([xshift=\CodeGutterWidth]frame.south west)--([xshift=\CodeGutterWidth]frame.north west);}
}

% ================== ENVIRONMENTS ==================
\newenvironment{highlights}{%
  \begin{itemize}[topsep=0pt,parsep=0.10cm,partopsep=0pt,itemsep=0pt,after=\vspace{-1\baselineskip},leftmargin=0.4cm+3pt]
}{\end{itemize}}

\newenvironment{header}{%
  \setlength{\topsep}{0pt}\par\kern\topsep\centering\color{primaryColor}\linespread{1.5}%
}{\par\kern\topsep}

% ---- CORRECT: changemargin (environment-style macro) ----
\makeatletter
\@ifundefined{changemargin}{%
  % Usage: \begin{changemargin}{<left>}{<right>} ... \end{changemargin}
  \newcommand{\changemargin}[2]{%
    \list{}{\rightmargin #2 \leftmargin #1
      \topsep=0pt \itemsep=0pt \parsep=0pt \parskip=0pt
      \labelwidth=0pt \itemindent=0pt \labelsep=0pt}%
    \item[]%
  }%
  \let\endchangemargin\endlist
}{}
\makeatother

% ================== FOOTER WITH PAGE X OF Y ==================
\makeatletter
\let\ps@customFooterStyle\ps@plain
\patchcmd{\ps@customFooterStyle}{\thepage}{%
  \color{gray}\textit{\small Sulman Olieko Owili - Page \thepage{} of \pageref*{LastPage}}%
}{}{}
\makeatother
\pagestyle{customFooterStyle}

% ================== "LAST UPDATED" STAMP (safe inside margins) ==================
\makeatletter
\newcommand{\placelastupdatedtext}{%
  \AddToShipoutPictureFG*{%
    % Anchor at the top-right corner of the TEXT AREA (not paper edge):
    \put(%
      \LenToUnit{\dimexpr\paperwidth-\Gm@rmargin-0.2cm\relax},% x: inside right margin with 0.2cm padding
      \LenToUnit{\dimexpr\paperheight-\Gm@tmargin-0.2cm\relax}% y: 0.2cm below top text boundary
    ){%
      \makebox[0pt][r]{\small\color{gray}\itshape Last updated on \today}%
    }%
  }%
}
\makeatother

% ================== HYPERREF SETUP ==================
\RequirePackage{hyperref}

% Global defaults for all docs using this class
\hypersetup{
  pdftitle={Sulman Olieko Owili CV},
  pdfauthor={Sulman Olieko Owili},
  colorlinks=true,
  urlcolor=primaryColor,
  hidelinks
}

% Optional: keep the external-link icon patch
\let\hrefWithoutArrow\href
\renewcommand{\href}[2]{%
  \hrefWithoutArrow{#1}{\mbox{\ifthenelse{\equal{#2}{}}{ }{#2 }%
  \raisebox{.15ex}{\scriptsize \textcolor{primaryColor}{\faExternalLink*}}}}}
