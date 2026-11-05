import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deviceName } from '@/lib/composter';
import { mockStir } from '@/mock/composter';
import type { Device } from '@/types';

/**
 * Stir command state: running countdown and the 1-minute cooldown.
 * ponytail: mockStir stands in for router.post(stir(device)) until slice 8.
 */
export function useStir(device: Device) {
    const [runUntil, setRunUntil] = useState(0);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [clock, setClock] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            const t = Date.now();
            setClock(t);

            if (t > cooldownUntil) {
                clearInterval(id);
            }
        }, 250);

        return () => clearInterval(id);
    }, [cooldownUntil]);

    const remaining = Math.max(0, Math.ceil((runUntil - clock) / 1000));
    const cooldown = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));

    const stir = (seconds: number) => {
        const result = mockStir(device.id);
        const t = Date.now();
        setClock(t);

        if (!result.ok) {
            setCooldownUntil(t + result.retryIn * 1000);
            toast.error(
                `Tunggu ${result.retryIn} detik sebelum mengaduk lagi.`,
            );

            return;
        }

        setRunUntil(t + seconds * 1000);
        setCooldownUntil(t + 60_000);
        toast.success('Perintah aduk terkirim', {
            description: `${deviceName(device)} mengaduk selama ${seconds} detik.`,
        });
    };

    return {
        stir,
        running: remaining > 0,
        remaining,
        cooldown,
        runUntil,
        disabled: device.status === 'offline' || cooldown > 0,
    };
}
