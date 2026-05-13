import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import SettingController from '@/actions/App/Http/Controllers/Admin/SettingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as settingsIndex } from '@/routes/settings';

export default function CompanyInfo() {
    const { props } = usePage();
    const settings = (props.settings as Record<string, string>) || {};

    return (
        <>
            <Head title="Company Info" />

            <h1 className="sr-only">Company Info</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Company Information"
                    description="Update your company's name, contact information, and currency settings."
                />

                <Form
                    {...SettingController.store.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={settings.name || ''}
                                    name="name"
                                    placeholder="Company Name"
                                />
                                <InputError className="mt-2" message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={settings.email || ''}
                                    name="email"
                                    placeholder="Email address"
                                />
                                <InputError className="mt-2" message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    className="mt-1 block w-full"
                                    defaultValue={settings.phone || ''}
                                    name="phone"
                                    placeholder="Phone"
                                />
                                <InputError className="mt-2" message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    className="mt-1 block w-full"
                                    defaultValue={settings.address || ''}
                                    name="address"
                                    placeholder="Address"
                                />
                                <InputError className="mt-2" message={errors.address} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="currency_symbol">Currency Default</Label>
                                <Input
                                    id="currency_symbol"
                                    className="mt-1 block w-full"
                                    defaultValue={settings.currency_symbol || '$'}
                                    name="currency_symbol"
                                    placeholder="e.g. $, €, etc"
                                />
                                <InputError className="mt-2" message={errors.currency_symbol} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                >
                                    Save Company Info
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">
                                        Saved
                                    </p>
                                </Transition>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CompanyInfo.layout = {
    breadcrumbs: [
        {
            title: 'Company Info',
            href: settingsIndex(),
        },
    ],
};
