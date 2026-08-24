$uglyShadow = "shadow-[0_2px_0_0_#fff,0_2px_12px_1px_rgba(255,255,255,0.9)]"
$css = @"
    /* Neon Active Line */
    .nav-neon-active { position: relative; color: white !important; }
    .nav-neon-active::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px; background-color: white; box-shadow: 0 0 10px 2px rgba(255,255,255,0.8); border-radius: 2px; }
"@

# Fix Index
$content = Get-Content "C:\Users\ThinkPad\Projects\SMPAnnida-Dev\index.html" -Raw
if ($content -notmatch "nav-neon-active") {
    $content = $content.Replace("</style>", "$css`n  </style>")
}
$content = $content.Replace("text-white pb-1 $uglyShadow", "nav-neon-active pb-1")
$content = $content.Replace("'text-white', '$uglyShadow'", "'nav-neon-active'")
Set-Content "C:\Users\ThinkPad\Projects\SMPAnnida-Dev\index.html" -Value $content

# Fix PPDB
$contentPpdb = Get-Content "C:\Users\ThinkPad\Projects\SMPAnnida-Dev\pages\ppdb\index.html" -Raw
if ($contentPpdb -notmatch "nav-neon-active") {
    $contentPpdb = $contentPpdb.Replace("</style>", "$css`n  </style>")
}
$contentPpdb = $contentPpdb.Replace("text-white pb-1 $uglyShadow", "nav-neon-active pb-1")
$contentPpdb = $contentPpdb.Replace("'text-white', '$uglyShadow'", "'nav-neon-active'")
Set-Content "C:\Users\ThinkPad\Projects\SMPAnnida-Dev\pages\ppdb\index.html" -Value $contentPpdb
