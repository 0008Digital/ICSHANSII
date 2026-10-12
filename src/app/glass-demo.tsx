"use client";

import { useState } from "react";
import { Badge, Button, Dialog, Glass, SegmentedControl, Slider, Switch, type MaterialPresetName } from "@/vendor/open-glass-ui/dist/index.js";
import { useAppearance } from "./providers";

export function GlassDemo() {
  const { appearance, setAppearance } = useAppearance();
  const [material, setMaterial] = useState<MaterialPresetName>("regular");
  const [interactive, setInteractive] = useState(true);
  const [depth, setDepth] = useState(50);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="demo-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="ambient" aria-hidden="true" />
      <header className="site-header">
        <Glass as="nav" material="frosted" className="glass-nav" aria-label="Main navigation">
          <a className="wordmark" href="#main"><span className="brand-mark" aria-hidden="true">i</span>ICS Hansi<span className="preview-label"> / Preview</span></a>
          <div className="nav-links"><a href="#materials">Materials</a><a href="#playground">Playground</a></div>
          <span className="nav-status"><span aria-hidden="true" />OpenGlass 0.4</span>
        </Glass>
      </header>
      <main id="main" className="demo-main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">A little clarity. A new perspective.</p>
          <h1 id="hero-title">Room to focus.<br /><span>Space to grow.</span></h1>
          <p className="hero-description">A quieter interface for what comes next. Explore dimensional surfaces, thoughtful controls, and an appearance that feels at home.</p>
          <div className="hero-actions"><Button variant="primary" size="large" onClick={() => setDialogOpen(true)}>Take a closer look <span aria-hidden="true">↗</span></Button><a href="#playground">Make it yours <span aria-hidden="true">↓</span></a></div>
        </section>
        <section id="playground" className="playground" aria-labelledby="playground-title">
          <Glass material={material} interactive={interactive} look={{ shadow: 0.5 + depth / 100 }} className="preview-surface">
            <div className="surface-heading"><Badge>Interface study / 01</Badge><span className="surface-symbol" aria-hidden="true">✳</span></div>
            <div className="surface-copy"><p className="eyebrow">Made for the everyday</p><h2 id="playground-title">Clear by design.</h2><p>Light, texture, and depth work together. The details stay out of your way.</p></div>
            <div className="surface-footer"><span>Live material preview</span><Badge tone="positive">{material}</Badge></div>
          </Glass>
          <Glass material="frosted" className="control-panel" as="section" aria-labelledby="controls-title">
            <div><p className="eyebrow">Your view</p><h2 id="controls-title">Find your balance</h2></div>
            <div className="control-group"><h3>Appearance</h3><SegmentedControl aria-label="Appearance" items={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} value={appearance} onValueChange={setAppearance} /></div>
            <div className="control-group"><h3>Material</h3><SegmentedControl aria-label="Glass material" items={[{ value: "clear", label: "Clear" }, { value: "regular", label: "Regular" }, { value: "frosted", label: "Frosted" }]} value={material} onValueChange={setMaterial} /></div>
            <Slider label="Depth" min={0} max={100} value={depth} valueText={`${depth}%`} onChange={(event) => setDepth(Number(event.target.value))} />
            <Switch label="Pointer interaction" description="Let the surface respond to movement." checked={interactive} onCheckedChange={setInteractive} />
          </Glass>
        </section>
        <section id="materials" className="material-section" aria-labelledby="materials-title">
          <div className="section-heading"><h2 id="materials-title">One system. Different perspectives.</h2><p>Three original OpenGlass materials.</p></div>
          <div className="material-grid">{([{ name: "clear", title: "A lighter touch", description: "A transparent lens that lets the surroundings speak." }, { name: "regular", title: "The everyday balance", description: "Just enough texture to bring the important things forward." }, { name: "frosted", title: "A moment of focus", description: "A softer backdrop for controls, conversations, and decisions." }] as const).map((item, index) => <Glass key={item.name} material={item.name} className="material-card" as="section"><span className="material-number">0{index + 1} / {item.name}</span><h3>{item.title}</h3><p>{item.description}</p></Glass>)}</div>
        </section>
      </main>
      <footer className="site-footer"><span>ICS Hansi · Interface preview</span><span>OpenGlass UI by Moe Luker · MIT</span></footer>
      <Dialog title="A closer look" description="An original OpenGlass dialog." open={dialogOpen} onOpenChange={setDialogOpen}>
        <p>This preview explores the interface only. Choose an appearance or material to see how the surfaces adapt.</p>
        <Button variant="primary" onClick={() => setDialogOpen(false)}>Back to exploring</Button>
      </Dialog>
    </div>
  );
}
