import type { VisualSettings, VisualMode, DitherStyle } from '../../organisms/Installation/installationConfig';
import { DEFAULT_SETTINGS } from '../../organisms/Installation/installationConfig';

interface SettingsPanelProps {
    settings: VisualSettings;
    setSettings: React.Dispatch<React.SetStateAction<VisualSettings>>;
}

const SettingsPanel = ({ settings, setSettings }: SettingsPanelProps) => (
    <div className="installation__settings">
        <div className="installation__settings-title">
            VISUAL SETTINGS <span style={{ opacity: 0.35 }}>Shift+D to close</span>
        </div>

        <div className="installation__settings-row">
            <label>MODE</label>
            <select
                value={settings.mode}
                onChange={e => setSettings(s => ({ ...s, mode: e.target.value as VisualMode }))}
            >
                <option value="light-on-dark">light on dark (glow)</option>
                <option value="dark-on-light">dark on light (shadow)</option>
            </select>
        </div>

        <div className="installation__settings-row">
            <label>DITHER STYLE</label>
            <select
                value={settings.ditherStyle}
                onChange={e => setSettings(s => ({ ...s, ditherStyle: e.target.value as DitherStyle }))}
            >
                <option value="none">none (flat silhouette)</option>
                <option value="bayer-dots">bayer dots (halftone)</option>
                <option value="cross-hatch">cross-hatch (lines)</option>
                <option value="blocky">blocky (datamosh)</option>
            </select>
        </div>

        <div className="installation__settings-row">
            <label>MASK SMOOTHING <span>{settings.smoothing.toFixed(1)}</span></label>
            <input
                type="range" min="0" max="10" step="1"
                value={Math.round(settings.smoothing * 10)}
                onChange={e => setSettings(s => ({ ...s, smoothing: parseInt(e.target.value) / 10 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>DITHER SCALE <span>{settings.ditherScale}px</span></label>
            <input
                type="range" min="2" max="14" step="1"
                value={settings.ditherScale}
                onChange={e => setSettings(s => ({ ...s, ditherScale: parseInt(e.target.value) }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>DEPTH (MULTI-SCALE) <span>{settings.depth.toFixed(1)}</span></label>
            <input
                type="range" min="0" max="10" step="1"
                value={Math.round(settings.depth * 10)}
                onChange={e => setSettings(s => ({ ...s, depth: parseInt(e.target.value) / 10 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>DOT GROW (TONE) <span>{settings.dotGrow.toFixed(1)}</span></label>
            <input
                type="range" min="0" max="10" step="1"
                value={Math.round(settings.dotGrow * 10)}
                onChange={e => setSettings(s => ({ ...s, dotGrow: parseInt(e.target.value) / 10 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>BREATHE <span>{settings.breathe.toFixed(1)}</span></label>
            <input
                type="range" min="0" max="10" step="1"
                value={Math.round(settings.breathe * 10)}
                onChange={e => setSettings(s => ({ ...s, breathe: parseInt(e.target.value) / 10 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>FEEDBACK WARP <span>{settings.warp.toFixed(1)}</span></label>
            <input
                type="range" min="0" max="10" step="1"
                value={Math.round(settings.warp * 10)}
                onChange={e => setSettings(s => ({ ...s, warp: parseInt(e.target.value) / 10 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>EDGE GLITCH <span>{settings.glitch.toFixed(1)}</span></label>
            <input
                type="range" min="0" max="10" step="1"
                value={Math.round(settings.glitch * 10)}
                onChange={e => setSettings(s => ({ ...s, glitch: parseInt(e.target.value) / 10 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>TRAIL DECAY <span>{settings.decay.toFixed(3)}</span></label>
            <input
                type="range" min="5" max="150" step="1"
                value={Math.round(settings.decay * 1000)}
                onChange={e => setSettings(s => ({ ...s, decay: parseInt(e.target.value) / 1000 }))}
            />
        </div>

        <div className="installation__settings-row">
            <label>GRAIN <span>{settings.grain.toFixed(2)}</span></label>
            <input
                type="range" min="0" max="20" step="1"
                value={Math.round(settings.grain * 100)}
                onChange={e => setSettings(s => ({ ...s, grain: parseInt(e.target.value) / 100 }))}
            />
        </div>

        <button
            className="installation__settings-reset"
            onClick={() => setSettings({ ...DEFAULT_SETTINGS })}
        >
            RESET DEFAULTS
        </button>
    </div>
);

export default SettingsPanel;